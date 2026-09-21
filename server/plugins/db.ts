import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import postgres from 'postgres'
import { env } from '../config/env.js'
import * as schema from '../db/schema.js'

// --- start types
declare module 'fastify' {
  interface FastifyInstance {
    db: PostgresJsDatabase<typeof schema>
  }
}
// --- end types

// --- plugin
export default fp(async (app: FastifyInstance) => {
  const client = postgres(env.DATABASE_URL, { max: 5, onnotice: () => {} })

  // Vrify the connection at startup
  try {
    await client`select 1`
    app.log.info('------- Connected to Database PostgreSQL  -------')
  } catch (err) {
    app.log.error({ err }, '------- PostgreSQL connection failed -------')
    throw err
  }

  app.decorate('db', drizzle(client, { schema }))

  app.addHook('onClose', async () => {
    await client.end()
  })
})
