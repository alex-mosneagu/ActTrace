import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@acttrace/browser': resolve(__dirname, '../../packages/browser/src/index.ts'),
    },
  },
})
