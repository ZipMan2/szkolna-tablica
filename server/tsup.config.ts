import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'server.ts',
    'app.ts',
    'config/**/*.ts',
    'plugins/**/*.ts',
    'modules/**/*.ts',
    'db/**/*.ts',
    '!**/*.test.ts', 
  ],
  format: ['esm'],
  target: 'node22',
  bundle: false,
  clean: true,
  outDir: 'dist',
})
