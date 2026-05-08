export type ActNetworkCall = {
  method: string
  url: string
  status?: number
  durationMs?: number
  error?: string
}

export type ActDomMutation = {
  added: number
  removed: number
  attributeChanged: number
}

export type ActError = {
  message: string
  source?: string
}

export type ActTrace = {
  id: string
  appName?: string
  startedAt: number
  endedAt?: number
  durationMs?: number

  event: {
    type: string
    phase: 'capture' | 'bubble'
    target: string
    actName?: string
    boundary?: string
  }

  network: ActNetworkCall[]
  mutations: ActDomMutation[]
  errors: ActError[]
}

export type ActTraceReporter = {
  report: (trace: ActTrace) => void
}

export type ActTraceOptions = {
  appName?: string
  enabled?: boolean
  debug?: boolean

  capture?: boolean
  bubble?: boolean
  events?: string[]
  traceWindowMs?: number

  observeFetch?: boolean
  observeXHR?: boolean
  observeMutations?: boolean
  observeErrors?: boolean

  reporter?: ActTraceReporter
}

export type ActTraceController = {
  stop: () => void
  flush: () => void
  getSnapshot: () => ActTrace[]
}

export type ResolvedOptions = {
  appName: string | undefined
  enabled: boolean
  debug: boolean
  capture: boolean
  bubble: boolean
  events: string[]
  traceWindowMs: number
  observeFetch: boolean
  observeXHR: boolean
  observeMutations: boolean
  observeErrors: boolean
  reporter: ActTraceReporter
}
