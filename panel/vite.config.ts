import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/panel/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    host: true, // reachable from LAN
    port: 5173,
    proxy: {
      '/api': 'http://localhost:2137',
      '/ws': { target: 'ws://localhost:2137', ws: true },
    },
  },
})
