import type { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { ZodError } from 'zod'

export default fp(async (app: FastifyInstance) => {
  // Do not leak internal error details on 500.
  // Zod validation failures should return 400 with issues list.
  app.setErrorHandler((err, req, reply) => {
    if (err instanceof ZodError) return reply.code(400).send({ error: 'Invalid data', issues: err.issues })

    const status = (err as { statusCode?: number }).statusCode ?? 500
    if (status >= 500) req.log.error(err)

    return reply.code(status).send({ error: status >= 500 ? 'Internal Server Error' : (err as Error).message })
  })
})
