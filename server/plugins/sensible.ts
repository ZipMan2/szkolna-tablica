import sensible from '@fastify/sensible'
import type { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

// Adds app.httpErrors.notFound(), reply.notFound(), etc.
export default fp(async (app: FastifyInstance) => {
  await app.register(sensible)
})
