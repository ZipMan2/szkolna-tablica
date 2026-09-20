import cookie from '@fastify/cookie'
import type { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { env } from '../config/env.js'

// Used later for session cookies (httpOnly, sameSite strict, secure via env)
export default fp(async (app: FastifyInstance) => {
  await app.register(cookie, { secret: env.COOKIE_SECRET })
})
