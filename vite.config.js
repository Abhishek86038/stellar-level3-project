import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@stellar/stellar-sdk/horizon': path.resolve(__dirname, './src/stellar-horizon-shim.js')
    }
  },
  optimizeDeps: {
    exclude: ['@stellar/stellar-sdk/horizon']
  },
  test: {
    environment: 'jsdom',
    globals: true
  }
})
