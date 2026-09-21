import { eq } from 'drizzle-orm'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { sessions, users } from '../db/schema.js'
import { SESSION_COOKIE, hashToken } from '../lib/session.js'

// --- start types
export type Role = 'admin' | 'editor'
export type SessionUser = { id: string; username: string; role: Role }

declare module 'fastify' {
  interface FastifyRequest {
    user: SessionUser | null
  }
  interface FastifyInstance {
    authenticate: (req: FastifyRequest) => Promise<void>
    requireRole: (...roles: Role[]) => (req: FastifyRequest) => Promise<void>
  }
}
// --- end types

// --- plugin
export default fp(async (app: FastifyInstance) => {
  app.decorateRequest('user', null)

  // CSRF: sameSite=strict is not enough alone.
  // Reject state-changing requests whose Origin host differs from Host header.
  app.addHook('onRequest', async req => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return

    // non-browser clients (tests, curl)
    const origin = req.headers.origin
    if (!origin) return

    let host = ''
    try {
      host = new URL(origin).host
    } catch {
      /* invalid origin */
    }
    if (host !== req.headers.host) throw app.httpErrors.forbidden('Bad origin')
  })

  // Load user from session cookie, join sessions + users
  const authenticate = async (req: FastifyRequest) => {
    const token = req.cookies[SESSION_COOKIE]
    if (!token) throw app.httpErrors.unauthorized()

    const [row] = await app.db
      .select({ id: users.id, username: users.username, role: users.role, expiresAt: sessions.expiresAt })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(eq(sessions.id, hashToken(token)))
      .limit(1)

    if (!row || row.expiresAt < new Date()) throw app.httpErrors.unauthorized()
    req.user = { id: row.id, username: row.username, role: row.role }
  }

  // Higher-order guard: authenticate + check role
  app.decorate('authenticate', authenticate)
  app.decorate('requireRole', (...roles: Role[]) => async (req: FastifyRequest) => {
    await authenticate(req)
    if (!roles.includes(req.user!.role)) throw app.httpErrors.forbidden()
  })
})
