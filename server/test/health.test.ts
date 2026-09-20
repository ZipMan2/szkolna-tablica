import { afterAll, beforeAll, expect, it } from 'vitest'
import { buildApp } from '../app.js'

let app: Awaited<ReturnType<typeof buildApp>>

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
})
afterAll(() => app.close())

it('GET /health returns ok', async () => {
  const res = await app.inject({ method: 'GET', url: '/health' })
  expect(res.statusCode).toBe(200)
  expect(res.json()).toEqual({ status: 'ok', service: 'school-board' })
})
