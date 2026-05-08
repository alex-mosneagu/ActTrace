import type { ResolvedOptions } from './types'
import type { TraceStore } from './traceStore'

// XHR tracing is optional in v0.0.1
export function createXhrObserver(_options: ResolvedOptions, _store: TraceStore) {
  return {
    start() {},
    stop() {},
  }
}
