import type { ActTraceOptions, ActTraceController, ResolvedOptions } from './types'
import { consoleReporter } from './reporter'
import { createTraceStore } from './traceStore'
import { createEventObserver } from './eventObserver'
import { createFetchObserver } from './fetchObserver'
import { createMutationObserver } from './mutationObserver'
import { createXhrObserver } from './xhrObserver'

let _activeController: ActTraceController | null = null

export function getActiveController(): ActTraceController | null {
  return _activeController
}

export function startActTrace(options: ActTraceOptions = {}): ActTraceController {
  const resolved: ResolvedOptions = {
    appName: options.appName,
    enabled: options.enabled ?? true,
    debug: options.debug ?? false,
    capture: options.capture ?? true,
    bubble: options.bubble ?? true,
    events: options.events ?? ['click', 'input', 'change', 'submit'],
    traceWindowMs: options.traceWindowMs ?? 2000,
    observeFetch: options.observeFetch ?? true,
    observeXHR: options.observeXHR ?? false,
    observeMutations: options.observeMutations ?? true,
    observeErrors: options.observeErrors ?? false,
    reporter: options.reporter ?? consoleReporter,
  }

  if (!resolved.enabled) {
    return { stop: () => {}, flush: () => {}, getSnapshot: () => [] }
  }

  const store = createTraceStore({
    appName: resolved.appName,
    traceWindowMs: resolved.traceWindowMs,
    reporter: resolved.reporter,
  })

  const eventObs = createEventObserver(resolved, store)
  const fetchObs = createFetchObserver(resolved, store)
  const mutationObs = createMutationObserver(resolved, store)
  const xhrObs = createXhrObserver(resolved, store)

  eventObs.start()
  fetchObs.start()
  mutationObs.start()
  xhrObs.start()

  const controller: ActTraceController = {
    stop() {
      eventObs.stop()
      fetchObs.stop()
      mutationObs.stop()
      xhrObs.stop()
      if (_activeController === controller) _activeController = null
    },
    flush() {
      store.flush()
    },
    getSnapshot() {
      return store.getSnapshot()
    },
  }

  _activeController = controller
  return controller
}
