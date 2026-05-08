import { startActTrace } from '@acttrace/browser'
import { createHttpReporter } from './httpReporter'

startActTrace({
  appName: 'dashboard-demo',
  reporter: createHttpReporter('/api/traces'),
})

document.querySelector('[data-act="customer.save"]')?.addEventListener('click', async () => {
  await fetch('/api/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Customer' }),
  })
  const list = document.getElementById('customer-list')
  if (list) {
    const item = document.createElement('li')
    item.textContent = `Customer #${list.children.length + 1}`
    list.appendChild(item)
  }
})

document.querySelector('[data-act="search.query"]')?.addEventListener('input', async (e) => {
  const value = (e.target as HTMLInputElement).value
  if (!value) return
  await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: value }),
  })
})

document.querySelector('form[data-act-boundary="LoginForm"]')?.addEventListener('submit', (e) => {
  e.preventDefault()
})
