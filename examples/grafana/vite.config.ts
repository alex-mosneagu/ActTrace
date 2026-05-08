import { defineConfig } from 'vite'
import { resolve } from 'path'
import type { Connect } from 'vite'

function mockApiMiddleware(): Connect.NextHandleFunction {
  return (req, res, next) => {
    // Simulate a successful POST with realistic latency
    if (req.url === '/api/customers' && req.method === 'POST') {
      setTimeout(() => {
        res.setHeader('Content-Type', 'application/json')
        res.statusCode = 201
        res.end(JSON.stringify({ id: Date.now(), message: 'Customer saved' }))
      }, 80 + Math.random() * 120)
      return
    }

    // Simulate a 500 server error
    if (req.url === '/api/crash') {
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 500
      res.end(JSON.stringify({ error: 'Internal Server Error', detail: 'Simulated crash' }))
      return
    }

    // Simulate a 404
    if (req.url === '/api/missing') {
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 404
      res.end(JSON.stringify({ error: 'Not Found', detail: 'Resource does not exist' }))
      return
    }

    // Simulate a slow endpoint (timeout territory)
    if (req.url === '/api/slow') {
      setTimeout(() => {
        res.setHeader('Content-Type', 'application/json')
        res.statusCode = 200
        res.end(JSON.stringify({ result: 'finally done' }))
      }, 2500)
      return
    }

    next()
  }
}

export default defineConfig({
  plugins: [
    {
      name: 'mock-api',
      configureServer(server) {
        server.middlewares.use(mockApiMiddleware())
      },
    },
  ],
  server: {
    port: 5175,
    proxy: {
      '/loki': {
        target: 'http://localhost:3100',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@acttrace/browser': resolve(__dirname, '../../packages/browser/src/index.ts'),
    },
  },
})
