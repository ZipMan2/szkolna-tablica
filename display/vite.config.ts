import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: true,
    port: 5170,
    proxy: {
      '/api': 'http://localhost:2137',
      '/ws': { target: 'ws://localhost:2137', ws: true },
    },
  },
})
