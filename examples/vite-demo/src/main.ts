import { startActTrace } from '@acttrace/browser'

startActTrace({ appName: 'acttrace-demo', debug: true })

document.querySelector('[data-act="customer.save"]')?.addEventListener('click', async () => {
  await fetch('/api/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test' }),
  })

  const list = document.getElementById('customer-list')
  if (list) {
    const item = document.createElement('li')
    item.textContent = 'New Customer'
    list.appendChild(item)
  }
})

document.querySelector('form[data-act-boundary="LoginForm"]')?.addEventListener('submit', (e) => {
  e.preventDefault()
})
