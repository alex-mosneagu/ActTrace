import type { ActTrace, ActNetworkCall, ActDomMutation, ActTraceReporter } from './types'
import { generateId } from './utils'

type TraceStoreOptions = {
  appName: string | undefined
  traceWindowMs: number
  reporter: ActTraceReporter
}

export function createTraceStore(options: TraceStoreOptions) {
  let activeTrace: ActTrace | null = null
  let closeTimer: ReturnType<typeof setTimeout> | null = null
  const history: ActTrace[] = []

  function closeTrace() {
    if (!activeTrace) return
    const trace = activeTrace
    activeTrace = null
    if (closeTimer) {
      clearTimeout(closeTimer)
      closeTimer = null
    }
    trace.endedAt = Date.now()
    trace.durationMs = trace.endedAt - trace.startedAt
    history.push(trace)
    options.reporter.report(trace)
  }

  function createTrace(event: Event, phase: 'capture' | 'bubble'): ActTrace {
    if (activeTrace) closeTrace()

    const newTrace: ActTrace = {
      id: generateId(),
      appName: options.appName,
      startedAt: Date.now(),
      event: {
        type: event.type,
        phase,
        target: '',
      },
      network: [],
      mutations: [],
      errors: [],
    }

    activeTrace = newTrace

    if (closeTimer) clearTimeout(closeTimer)
    closeTimer = setTimeout(closeTrace, options.traceWindowMs)

    return newTrace
  }

  function setTraceEventDetails(details: Partial<ActTrace['event']>) {
    if (!activeTrace) return
    Object.assign(activeTrace.event, details)
  }

  function appendNetworkCall(call: ActNetworkCall) {
    if (!activeTrace) return
    activeTrace.network.push(call)
  }

  function appendMutation(mutation: ActDomMutation) {
    if (!activeTrace) return
    if (activeTrace.mutations.length === 0) {
      activeTrace.mutations.push({ ...mutation })
    } else {
      const existing = activeTrace.mutations[0]
      existing.added += mutation.added
      existing.removed += mutation.removed
      existing.attributeChanged += mutation.attributeChanged
    }
  }

  function flush() {
    closeTrace()
  }

  function getSnapshot(): ActTrace[] {
    return [...history]
  }

  function getActiveTrace(): ActTrace | null {
    return activeTrace
  }

  return {
    createTrace,
    setTraceEventDetails,
    appendNetworkCall,
    appendMutation,
    flush,
    getSnapshot,
    getActiveTrace,
  }
}

export type TraceStore = ReturnType<typeof createTraceStore>
