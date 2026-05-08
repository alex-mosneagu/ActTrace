import type { ActTraceReporter, ActTrace } from '@acttrace/browser'

export function createHttpReporter(url: string): ActTraceReporter {
  return {
    report(trace: ActTrace) {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trace),
      }).catch(() => {})
    },
  }
}
