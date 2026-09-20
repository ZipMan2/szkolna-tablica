import { defineConfig } from 'vitest/config'

// Autoload uses native import(); tsx lets Node resolve ./x.js -> ./x.ts.
process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS ?? ''} --import tsx`.trim()

export default defineConfig({
  test: {
    setupFiles: ['test/setup.ts'],
    fileParallelism: false,
    env: { NODE_ENV: 'test' },
  },
})