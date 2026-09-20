import { buildApp } from './app.js'
import { env } from './config/env.js'

const start = async () => {
  const app = await buildApp()

  // Close connections before exiting
  const shutdown = async (signal: string) => {
    app.log.info(`[${signal}] Shutting down...`)
    await app.close()
    process.exit(0)
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))

  // Start server
  try {
    await app.listen({ port: env.PORT, host: env.HOST })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
