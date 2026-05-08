import type { ActTrace, ActTraceReporter } from './types'

let traceCount = 0

export const consoleReporter: ActTraceReporter = {
  report(trace: ActTrace) {
    traceCount++
    const label = trace.event.actName ?? trace.event.type
    const appPrefix = trace.appName ? `${trace.appName} / ` : ''

    console.groupCollapsed(`▶ ActTrace #${traceCount} — ${appPrefix}${label}`)
    console.log(`  event    ${trace.event.type}`)

    if (trace.event.target && trace.event.target !== 'unknown') {
      console.log(`  target   ${trace.event.target}`)
    }

    if (trace.event.boundary) {
      console.log(`  boundary ${trace.event.boundary}`)
    }

    for (const call of trace.network) {
      const status = call.status !== undefined ? ` → ${call.status}` : ''
      const duration = call.durationMs !== undefined ? ` (${call.durationMs}ms)` : ''
      const err = call.error ? ` [error: ${call.error}]` : ''
      console.log(`  network  ${call.method} ${call.url}${status}${duration}${err}`)
    }

    if (trace.mutations.length > 0) {
      const m = trace.mutations[0]
      const total = m.added + m.removed + m.attributeChanged
      console.log(`  dom      ${total} mutations (${m.added} added, ${m.removed} removed, ${m.attributeChanged} attr)`)
    }

    if (trace.durationMs !== undefined) {
      console.log(`  duration ${trace.durationMs}ms`)
    }

    console.groupEnd()
  },
}
