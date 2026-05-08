/**
 * Captures browser-side JS errors and forwards them to Loki as structured logs.
 * Monitors: window.onerror, unhandledrejection, console.error, console.warn.
 *
 * Must be initialised BEFORE startActTrace() so its own Loki push requests
 * use the original (un-patched) fetch and don't appear as trace network calls.
 */

type FrontendErrorOptions = {
  /** Same base URL / proxy as LokiReporter. Leave empty to use Vite proxy. */
  lokiUrl?: string
  labels?: Record<string, string>
}

function argsToMessage(args: unknown[]): string {
  return args
    .map(a => {
      if (typeof a === 'string') return a
      if (a instanceof Error) return `${a.message}\n${a.stack ?? ''}`
      try { return JSON.stringify(a) } catch { return String(a) }
    })
    .join(' ')
}

export function startFrontendErrorReporter(options: FrontendErrorOptions = {}) {
  // Capture native fetch NOW — before startActTrace() patches globalThis.fetch
  const nativeFetch = globalThis.fetch.bind(globalThis)

  const baseUrl = options.lokiUrl ?? ''
  const endpoint = `${baseUrl}/loki/api/v1/push`

  const baseLabels: Record<string, string> = {
    app: 'acttrace',
    stream: 'frontend-errors',
    ...options.labels,
  }

  function push(
    level: 'error' | 'warn',
    errorType: string,
    message: string,
    extra: Record<string, unknown> = {}
  ) {
    const timestampNs = String(Date.now() * 1_000_000)
    const logLine = JSON.stringify({
      type: 'frontend-error',
      level,
      errorType,
      message: message.slice(0, 1000),
      timestamp: Date.now(),
      ...extra,
    })

    nativeFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        streams: [
          {
            stream: { ...baseLabels, level, errorType },
            values: [[timestampNs, logLine]],
          },
        ],
      }),
    }).catch(() => {})
  }

  // ── window.onerror — uncaught synchronous exceptions ──────────────
  const prevOnError = window.onerror
  window.onerror = function (msg, source, line, col, error) {
    push('error', 'uncaught-exception', String(msg), {
      source,
      line,
      col,
      stack: error?.stack,
    })
    return prevOnError ? prevOnError.call(this, msg, source, line, col, error) : false
  }

  // ── unhandledrejection — unhandled async errors ────────────────────
  function onUnhandled(e: PromiseRejectionEvent) {
    const reason = e.reason
    push('error', 'unhandled-rejection',
      reason instanceof Error ? reason.message : String(reason),
      { stack: reason instanceof Error ? reason.stack : undefined }
    )
  }
  window.addEventListener('unhandledrejection', onUnhandled)

  // ── console.error — explicit error logging in the app ─────────────
  const origError = console.error
  console.error = function (...args: unknown[]) {
    origError.apply(console, args)
    push('error', 'console.error', argsToMessage(args))
  }

  // ── console.warn — warnings that aren't surfaced in the UI ────────
  const origWarn = console.warn
  console.warn = function (...args: unknown[]) {
    origWarn.apply(console, args)
    push('warn', 'console.warn', argsToMessage(args))
  }

  return {
    stop() {
      window.onerror = prevOnError
      window.removeEventListener('unhandledrejection', onUnhandled)
      console.error = origError
      console.warn = origWarn
    },
  }
}
