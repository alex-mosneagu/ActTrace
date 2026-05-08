import { startActTrace } from '@acttrace/browser'
import { createLokiReporter } from './lokiReporter'
import { startFrontendErrorReporter } from './frontendErrorReporter'

// Both reporters must be initialised BEFORE startActTrace so they capture
// the original (un-patched) fetch — keeping Loki pushes out of trace network calls.
const lokiReporter = createLokiReporter({ labels: { env: 'dev' } })
startFrontendErrorReporter({ labels: { env: 'dev' } })

startActTrace({
  appName: 'grafana-demo',
  reporter: lokiReporter,
})

const log = document.getElementById('log')!
function note(msg: string, ok = true) {
  log.innerHTML = `<span class="${ok ? 'ok' : 'err'}">${msg}</span>`
}

// ── Normal interactions ────────────────────────────────────────────

document.querySelector('[data-act="customer.save"]')?.addEventListener('click', async () => {
  const res = await fetch('/api/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Customer' }),
  })
  const list = document.getElementById('customer-list')!
  const item = document.createElement('li')
  item.textContent = `Customer #${list.children.length + 1} — ${res.status}`
  list.appendChild(item)
})

document.querySelector('form[data-act-boundary="LoginForm"]')?.addEventListener('submit', e => {
  e.preventDefault()
})

// ── Network error simulation ───────────────────────────────────────

document.querySelector('[data-act="error.not-found"]')?.addEventListener('click', async () => {
  note('Requesting /api/missing…')
  const res = await fetch('/api/missing')
  note(`404 trace recorded → status ${res.status}`, res.ok)
})

document.querySelector('[data-act="error.server-crash"]')?.addEventListener('click', async () => {
  note('Requesting /api/crash…')
  const res = await fetch('/api/crash')
  note(`500 trace recorded → status ${res.status}`, res.ok)
})

document.querySelector('[data-act="error.slow-response"]')?.addEventListener('click', async () => {
  note('Waiting for slow response (2.5 s)…')
  const res = await fetch('/api/slow')
  note(`Slow trace recorded → ${res.status}`, res.ok)
})

document.querySelector('[data-act="error.network-fail"]')?.addEventListener('click', async () => {
  note('Triggering connection refused…')
  try {
    await fetch('http://localhost:19999/unreachable')
  } catch {
    note('Network fail trace recorded → connection refused', false)
  }
})

// ── Frontend JS error simulation ──────────────────────────────────
// Each button produces a real browser error captured by frontendErrorReporter
// and forwarded to Loki as stream="frontend-errors". Nothing visible in the UI
// (by design) — the point is that Grafana sees them even when users don't.

document.querySelector('[data-act="sim.uncaught-error"]')?.addEventListener('click', () => {
  note('Throwing uncaught TypeError… (check console + Grafana)')
  // setTimeout escapes the current call stack so the error is truly uncaught
  setTimeout(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user: any = null
    console.log(user.profile.name) // TypeError: Cannot read properties of null
  }, 0)
})

document.querySelector('[data-act="sim.unhandled-rejection"]')?.addEventListener('click', () => {
  note('Creating unhandled promise rejection… (check console + Grafana)')
  // No .catch() — browser fires unhandledrejection event
  Promise.reject(new Error('Async operation failed: session token expired'))
})

document.querySelector('[data-act="sim.console-warn"]')?.addEventListener('click', () => {
  note('Emitting console.warn…', true)
  console.warn('[CustomerModule] Slow render detected', {
    component: 'CustomerList',
    renderMs: 847,
    threshold: 200,
    suggestion: 'Consider virtualising the list',
  })
})

document.querySelector('[data-act="sim.console-error"]')?.addEventListener('click', () => {
  note('Emitting console.error…', false)
  console.error('[AuthModule] Token refresh failed — user will be logged out', {
    code: 'ERR_TOKEN_EXPIRED',
    userId: 'usr_4821',
    retryCount: 3,
  })
})

document.querySelector('[data-act="sim.silent-api-fail"]')?.addEventListener('click', async () => {
  // The API call fails (500) but the UI swallows the error silently.
  // In production this is the worst kind of bug — user sees nothing wrong.
  // ActTrace records the failed network call; frontendErrorReporter logs the
  // console.error that a real app would emit for this scenario.
  note('Silent API fail: UI shows nothing, Grafana sees the error')
  try {
    const res = await fetch('/api/crash')
    if (!res.ok) {
      // Real app might log here but show no UI feedback
      console.error('[OrderService] Background sync failed silently', {
        status: res.status,
        endpoint: '/api/crash',
        impact: 'Order state may be inconsistent',
      })
    }
  } catch (err) {
    console.error('[OrderService] Unexpected error during background sync', err)
  }
})

document.querySelector('[data-act="sim.reference-error"]')?.addEventListener('click', () => {
  note('Throwing ReferenceError… (check console + Grafana)')
  setTimeout(() => {
    // @ts-expect-error — intentional: reference to undefined variable
    console.log(nonExistentVariable.toString())
  }, 0)
})
