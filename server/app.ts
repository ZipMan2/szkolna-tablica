import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import AutoLoad, { type AutoloadPluginOptions } from '@fastify/autoload'
import Fastify, { type FastifyInstance } from 'fastify'
import { env, isDevelopment } from './config/env.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// Register autoload only if the directory exists (folders may still be empty)
const autoloadIfExists = async (app: FastifyInstance, options: AutoloadPluginOptions) => {
  if (existsSync(options.dir)) {
    await app.register(AutoLoad, options)
  }
}

export async function buildApp() {
  // Logger setup
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport: isDevelopment ? { target: 'pino-pretty' } : undefined,
      redact: ['headers.authorization', 'headers.cookie'], 
    },
    genReqId: req => (req.headers['x-request-id'] as string) ?? randomUUID(),
  })

  // Autoload global plugins 
  await autoloadIfExists(app, {
    dir: join(__dirname, 'plugins'),
    dirNameRoutePrefix: false,
  })

  // Autoload routes
  await autoloadIfExists(app, {
    dir: join(__dirname, 'modules/v1'),
    dirNameRoutePrefix: false,
    options: { prefix: '/api/v1' },
    matchFilter: (path: string) => /\.route\.(ts|js)$/.test(path),
  })

  // Health route
  app.get('/health', () => ({ status: 'ok', service: 'school-board' }))

  return app
}
