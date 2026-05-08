import type { ResolvedOptions } from './types'
import type { TraceStore } from './traceStore'
import { resolveTarget, resolveActName, resolveBoundary, isSensitive } from './domResolver'

export function createEventObserver(options: ResolvedOptions, store: TraceStore) {
  const handlers: Array<{ type: string; handler: (e: Event) => void; useCapture: boolean }> = []

  // When capture is true, use capture phase. Fall back to bubble if capture is disabled.
  // Both phases are not used simultaneously to avoid duplicate traces per user action.
  const useCapture = options.capture
  const useBubble = !options.capture && options.bubble

  function handleEvent(event: Event, phase: 'capture' | 'bubble') {
    store.createTrace(event, phase)

    if (isSensitive(event.target)) {
      store.setTraceEventDetails({ target: '[sensitive]' })
    } else {
      store.setTraceEventDetails({
        target: resolveTarget(event.target),
        actName: resolveActName(event.target),
        boundary: resolveBoundary(event.target),
      })
    }
  }

  function start() {
    for (const eventType of options.events) {
      if (useCapture) {
        const handler = (e: Event) => handleEvent(e, 'capture')
        handlers.push({ type: eventType, handler, useCapture: true })
        document.addEventListener(eventType, handler, true)
      } else if (useBubble) {
        const handler = (e: Event) => handleEvent(e, 'bubble')
        handlers.push({ type: eventType, handler, useCapture: false })
        document.addEventListener(eventType, handler, false)
      }
    }
  }

  function stop() {
    for (const { type, handler, useCapture } of handlers) {
      document.removeEventListener(type, handler, useCapture)
    }
    handlers.length = 0
  }

  return { start, stop }
}
