import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

// Minimal trace shape — mirrors ActTrace from @acttrace/browser
type Trace = {
  id: string
  appName?: string
  startedAt: number
  endedAt?: number
  durationMs?: number
  event: { type: string; phase: string; target: string; actName?: string; boundary?: string }
  network: Array<{ method: string; url: string; status?: number; durationMs?: number; error?: string }>
  mutations: Array<{ added: number; removed: number; attributeChanged: number }>
  errors: Array<{ message: string; source?: string }>
}

const traces: Trace[] = []
const subscribers = new Set<express.Response>()

function broadcast(trace: Trace) {
  const data = `data: ${JSON.stringify(trace)}\n\n`
  for (const res of subscribers) {
    res.write(data)
  }
}

// Receive traces from the browser custom reporter
app.post('/api/traces', (req, res) => {
  const trace = req.body as Trace
  traces.push(trace)
  broadcast(trace)
  res.status(201).json({ ok: true })
})

// Return all stored traces (used on dashboard initial load)
app.get('/api/traces', (_req, res) => {
  res.json(traces)
})

// SSE stream — dashboard subscribes here for real-time updates
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  // Send all existing traces so the dashboard catches up immediately
  for (const trace of traces) {
    res.write(`data: ${JSON.stringify(trace)}\n\n`)
  }

  subscribers.add(res)
  req.on('close', () => subscribers.delete(res))
})

// Fake API endpoint so fetch calls in the demo actually resolve
app.post('/api/customers', async (req, res) => {
  await new Promise(r => setTimeout(r, 120 + Math.random() * 80))
  res.status(201).json({ id: Date.now(), ...req.body })
})

app.post('/api/search', async (req, res) => {
  await new Promise(r => setTimeout(r, 60 + Math.random() * 40))
  res.json({ results: [] })
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`ActTrace dashboard server → http://localhost:${PORT}`)
  console.log(`  POST /api/traces   receive traces`)
  console.log(`  GET  /api/events   SSE stream for dashboard`)
})
