type Trace = {
  id: string
  appName?: string
  startedAt: number
  durationMs?: number
  event: { type: string; target: string; actName?: string; boundary?: string }
  network: Array<{ method: string; url: string; status?: number; durationMs?: number; error?: string }>
  mutations: Array<{ added: number; removed: number; attributeChanged: number }>
}

let traces: Trace[] = []

const traceList = document.getElementById('trace-list')!
const statTotal = document.getElementById('stat-total')!
const statAvg = document.getElementById('stat-avg')!
const statNetwork = document.getElementById('stat-network')!
const statMutations = document.getElementById('stat-mutations')!
const statusDot = document.getElementById('status-dot')!
const statusText = document.getElementById('status-text')!

const EVENT_COLORS: Record<string, string> = {
  click: '#3b82f6',
  input: '#10b981',
  change: '#f59e0b',
  submit: '#8b5cf6',
}

function eventColor(type: string): string {
  return EVENT_COLORS[type] ?? '#6b7280'
}

function updateStats() {
  const total = traces.length
  const avgMs = total > 0
    ? Math.round(traces.reduce((s, t) => s + (t.durationMs ?? 0), 0) / total)
    : 0
  const netTotal = traces.reduce((s, t) => s + t.network.length, 0)
  const mutTotal = traces.reduce((s, t) =>
    s + t.mutations.reduce((ms, m) => ms + m.added + m.removed + m.attributeChanged, 0), 0)

  statTotal.textContent = String(total)
  statAvg.textContent = `${avgMs}ms`
  statNetwork.textContent = String(netTotal)
  statMutations.textContent = String(mutTotal)
}

function renderCard(trace: Trace, prepend = true) {
  const color = eventColor(trace.event.type)
  const label = trace.event.actName ?? trace.event.type
  const time = new Date(trace.startedAt).toLocaleTimeString()

  const netLines = trace.network.map(c => {
    const status = c.status !== undefined ? ` → ${c.status}` : ''
    const dur = c.durationMs !== undefined ? ` (${c.durationMs}ms)` : ''
    const err = c.error ? ` ⚠ ${c.error}` : ''
    const statusClass = c.status && c.status >= 400 ? ' net-error' : ''
    return `<span class="net-call${statusClass}">${c.method} ${c.url}${status}${dur}${err}</span>`
  }).join('')

  const mutCount = trace.mutations.reduce((s, m) => s + m.added + m.removed + m.attributeChanged, 0)

  const card = document.createElement('div')
  card.className = 'trace-card'
  card.innerHTML = `
    <div class="card-header">
      <span class="event-badge" style="background:${color}">${trace.event.type}</span>
      <span class="act-name">${label}</span>
      ${trace.event.boundary ? `<span class="boundary">${trace.event.boundary}</span>` : ''}
      <span class="trace-time">${time}</span>
    </div>
    <div class="trace-target">${trace.event.target}</div>
    <div class="trace-meta">
      ${netLines ? `<span class="meta-group">🌐 ${netLines}</span>` : ''}
      ${mutCount > 0 ? `<span class="meta-item">🔧 ${mutCount} mutations</span>` : ''}
      ${trace.durationMs !== undefined ? `<span class="meta-item">⏱ ${trace.durationMs}ms</span>` : ''}
    </div>
  `

  if (prepend) {
    traceList.prepend(card)
  } else {
    traceList.appendChild(card)
  }
}

function setStatus(connected: boolean) {
  statusDot.style.background = connected ? '#10b981' : '#ef4444'
  statusText.textContent = connected ? 'Live' : 'Reconnecting…'
}

function connect() {
  const es = new EventSource('/api/events')

  es.onopen = () => setStatus(true)

  es.onmessage = (e) => {
    const trace: Trace = JSON.parse(e.data)
    traces.push(trace)
    renderCard(trace)
    updateStats()
  }

  es.onerror = () => {
    setStatus(false)
    es.close()
    setTimeout(connect, 2000)
  }
}

document.getElementById('btn-clear')?.addEventListener('click', () => {
  traces = []
  traceList.innerHTML = '<p class="empty-state">Interact with the demo page to see traces appear here.</p>'
  updateStats()
})

connect()
updateStats()
