import type { ResolvedOptions } from './types'
import type { TraceStore } from './traceStore'

// Module-level state shared across all active instances so fetch is only patched once.
let originalFetch: typeof globalThis.fetch | null = null
const activeStores = new Set<TraceStore>()

async function patchedFetch(this: unknown, input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const method = ((init?.method) ?? (input instanceof Request ? input.method : 'GET')).toUpperCase()
  const url = input instanceof Request ? input.url : String(input)
  const startTime = Date.now()

  try {
    const response = await originalFetch!.call(this, input, init)
    const durationMs = Date.now() - startTime
    for (const store of activeStores) {
      store.appendNetworkCall({ method, url, status: response.status, durationMs })
    }
    return response
  } catch (err) {
    const durationMs = Date.now() - startTime
    const error = err instanceof Error ? err.message : String(err)
    for (const store of activeStores) {
      store.appendNetworkCall({ method, url, durationMs, error })
    }
    throw err
  }
}

export function createFetchObserver(options: ResolvedOptions, store: TraceStore) {
  let registered = false

  function start() {
    if (!options.observeFetch) return
    if (typeof globalThis.fetch === 'undefined') return
    if (registered) return

    activeStores.add(store)
    registered = true

    if (activeStores.size === 1) {
      originalFetch = globalThis.fetch
      globalThis.fetch = patchedFetch as typeof globalThis.fetch
    }
  }

  function stop() {
    if (!registered) return
    activeStores.delete(store)
    registered = false

    if (activeStores.size === 0 && originalFetch) {
      globalThis.fetch = originalFetch
      originalFetch = null
    }
  }

  return { start, stop }
}
