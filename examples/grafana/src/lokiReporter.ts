import type { ActTrace, ActTraceReporter } from '@acttrace/browser'

type LokiReporterOptions = {
  /**
   * Base URL of the Loki instance.
   * - Via Vite proxy (dev): leave empty — requests go to /loki/api/v1/push
   * - Direct (production): 'http://your-loki-host:3100'
   */
  url?: string
  /** Extra stream labels attached to every log entry */
  labels?: Record<string, string>
}

export function createLokiReporter(options: LokiReporterOptions = {}): ActTraceReporter {
  // Capture native fetch NOW so Loki push requests don't appear in ActTrace network calls
  const nativeFetch = globalThis.fetch.bind(globalThis)

  const baseUrl = options.url ?? ''
  const endpoint = `${baseUrl}/loki/api/v1/push`

  const baseLabels: Record<string, string> = {
    app: 'acttrace',
    ...options.labels,
  }

  return {
    report(trace: ActTrace) {
      const timestampNs = String(trace.startedAt * 1_000_000)

      const failedCalls = trace.network.filter(
        c => c.error !== undefined || (c.status !== undefined && c.status >= 400)
      )
      const hasError = failedCalls.length > 0

      const mutationCount = trace.mutations.reduce(
        (sum, m) => sum + m.added + m.removed + m.attributeChanged,
        0
      )

      const logLine = JSON.stringify({
        traceId: trace.id,
        appName: trace.appName,
        event: trace.event.type,
        actName: trace.event.actName,
        boundary: trace.event.boundary,
        target: trace.event.target,
        durationMs: trace.durationMs ?? 0,
        networkCalls: trace.network.length,
        domMutations: mutationCount,
        hasError,
        errorMessages: failedCalls.map(c => c.error ?? `HTTP ${c.status}`),
        network: trace.network.map(c => ({
          method: c.method,
          url: c.url,
          status: c.status,
          durationMs: c.durationMs,
          error: c.error,
        })),
      })

      const payload = {
        streams: [
          {
            stream: {
              ...baseLabels,
              event: trace.event.type,
              // hasError as a label enables direct stream filtering: {hasError="true"}
              hasError: String(hasError),
              // level is recognised by Grafana for log colouring
              level: hasError ? 'error' : 'info',
              ...(trace.event.boundary ? { boundary: trace.event.boundary } : {}),
            },
            values: [[timestampNs, logLine]],
          },
        ],
      }

      nativeFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {})
    },
  }
}
