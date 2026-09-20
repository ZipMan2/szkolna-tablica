import helmet from '@fastify/helmet'
import type { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'

export default fp(async (app: FastifyInstance) => {
  await app.register(helmet, {
    hsts: false,
    contentSecurityPolicy: {
      directives: {
        'upgrade-insecure-requests': null,
        'img-src': ["'self'", 'data:', 'blob:'],
      },
    },
  })
})
