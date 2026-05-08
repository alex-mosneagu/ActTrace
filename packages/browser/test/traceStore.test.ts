import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createTraceStore } from '../src/traceStore'
import type { ActTraceReporter } from '../src/types'

function makeStore(overrides: { traceWindowMs?: number; reporter?: ActTraceReporter } = {}) {
  const reporter = overrides.reporter ?? { report: vi.fn() }
  return {
    store: createTraceStore({
      appName: 'test',
      traceWindowMs: overrides.traceWindowMs ?? 100,
      reporter,
    }),
    reporter,
  }
}

describe('createTraceStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('createTrace returns a trace with id and startedAt', () => {
    const { store } = makeStore()
    const event = new Event('click')
    const trace = store.createTrace(event, 'capture')

    expect(trace.id).toMatch(/^act-/)
    expect(trace.startedAt).toBeGreaterThan(0)
    expect(trace.event.type).toBe('click')
    expect(trace.event.phase).toBe('capture')
  })

  it('appendNetworkCall attaches to the active trace', () => {
    const { store } = makeStore()
    store.createTrace(new Event('click'), 'capture')
    store.appendNetworkCall({ method: 'POST', url: '/api/test', status: 201, durationMs: 50 })

    const active = store.getActiveTrace()
    expect(active?.network).toHaveLength(1)
    expect(active?.network[0]).toMatchObject({ method: 'POST', url: '/api/test', status: 201 })
  })

  it('trace auto-closes and reports after traceWindowMs', () => {
    const reporter = { report: vi.fn() }
    const { store } = makeStore({ traceWindowMs: 100, reporter })

    store.createTrace(new Event('click'), 'capture')
    expect(reporter.report).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)

    expect(reporter.report).toHaveBeenCalledOnce()
    const reported = reporter.report.mock.calls[0][0]
    expect(reported.endedAt).toBeDefined()
    expect(reported.durationMs).toBeGreaterThanOrEqual(0)
  })

  it('second rapid event closes the first trace immediately', () => {
    const reporter = { report: vi.fn() }
    const { store } = makeStore({ reporter })

    store.createTrace(new Event('click'), 'capture')
    store.createTrace(new Event('click'), 'capture')

    expect(reporter.report).toHaveBeenCalledOnce()
  })

  it('appendMutation accumulates counts on the active trace', () => {
    const { store } = makeStore()
    store.createTrace(new Event('click'), 'capture')
    store.appendMutation({ added: 2, removed: 0, attributeChanged: 1 })
    store.appendMutation({ added: 1, removed: 1, attributeChanged: 0 })

    const active = store.getActiveTrace()
    expect(active?.mutations[0]).toEqual({ added: 3, removed: 1, attributeChanged: 1 })
  })

  it('getSnapshot returns all completed traces', () => {
    const { store } = makeStore({ traceWindowMs: 50 })
    store.createTrace(new Event('click'), 'capture')
    vi.advanceTimersByTime(50)
    store.createTrace(new Event('input'), 'capture')
    vi.advanceTimersByTime(50)

    const snapshot = store.getSnapshot()
    expect(snapshot).toHaveLength(2)
    expect(snapshot[0].event.type).toBe('click')
    expect(snapshot[1].event.type).toBe('input')
  })

  it('flush closes active trace immediately', () => {
    const reporter = { report: vi.fn() }
    const { store } = makeStore({ reporter })

    store.createTrace(new Event('click'), 'capture')
    store.flush()

    expect(reporter.report).toHaveBeenCalledOnce()
    expect(store.getActiveTrace()).toBeNull()
  })
})
