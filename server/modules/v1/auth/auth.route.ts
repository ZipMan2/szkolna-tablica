import { randomBytes, timingSafeEqual } from 'node:crypto'
import { count, eq, sql } from 'drizzle-orm'
import type { FastifyPluginAsync } from 'fastify'
import { sessions, users } from '../../../db/schema.js'
import { DUMMY_HASH, hashPassword, verifyPassword } from '../../../lib/password.js'
import { SESSION_COOKIE, hashToken, startSession } from '../../../lib/session.js'
import { loginBody, setupBody } from './auth.schemas.js'

// 5 requests per minute
const strictLimit = { rateLimit: { max: 5, timeWindow: '1 minute' } }

// Compare setup codes in constant time
const safeEqual = (a: string, b: string) => timingSafeEqual(Buffer.from(hashToken(a)), Buffer.from(hashToken(b)))

const route: FastifyPluginAsync = async app => {
  // First boot: no users, generate one-time setup code and print it to server logs.
  // Prevents anyone on LAN from becoming the first admin before you.
  let setupCode: string | null = null

  // Logging setup code
  const [{ n }] = await app.db.select({ n: count() }).from(users)
  if (n === 0) {
    setupCode = randomBytes(9).toString('base64url')
    app.log.warn(`FIRST RUN: open the panel and create the admin account. Setup code: ${setupCode}`)
  }

  // --- routes ---
  // check if first setup is required
  app.get('/auth/status', async () => ({ setupRequired: setupCode !== null }))

  // create first admin
  app.post('/auth/setup', { config: strictLimit }, async (req, reply) => {
    const { username, password, setupCode: code } = setupBody.parse(req.body)

    // Check setup code
    if (!setupCode) throw app.httpErrors.conflict('Setup already completed')
    if (!safeEqual(code, setupCode)) throw app.httpErrors.forbidden('Invalid setup code')

    const passwordHash = await hashPassword(password)

    // Advisory lock: two simultaneous setups can't both create an admin
    const admin = await app.db.transaction(async tx => {
      await tx.execute(sql`select pg_advisory_xact_lock(4242)`)

      // Check if admin already exists
      const [{ n }] = await tx.select({ n: count() }).from(users)
      if (n > 0) return null

      // Create admin
      const [u] = await tx
        .insert(users)
        .values({ username, passwordHash, role: 'admin' })
        .returning({ id: users.id, username: users.username, role: users.role })
      return u
    })

    // Check if admin was created
    if (!admin) throw app.httpErrors.conflict('Setup already completed')

    setupCode = null
    await startSession(app.db, reply, admin.id)
    return reply.code(201).send({ user: admin })
  })

  // login
  app.post('/auth/login', { config: strictLimit }, async (req, reply) => {
    const { username, password } = loginBody.parse(req.body)

    // Check if user exists
    const [user] = await app.db.select().from(users).where(eq(users.username, username)).limit(1)

    // Check password (dummy hash if user is missing): same timing, same error message
    const ok = await verifyPassword(user?.passwordHash ?? DUMMY_HASH, password)
    if (!user || !ok) throw app.httpErrors.unauthorized('Invalid username or password')

    await startSession(app.db, reply, user.id)
    return { user: { id: user.id, username: user.username, role: user.role } }
  })

  // logout
  app.post('/auth/logout', async (req, reply) => {
    const token = req.cookies[SESSION_COOKIE]

    if (token) await app.db.delete(sessions).where(eq(sessions.id, hashToken(token)))

    reply.clearCookie(SESSION_COOKIE, { path: '/' })
    return { ok: true }
  })

  // return current user
  app.get('/auth/me', { preHandler: app.authenticate }, async req => ({ user: req.user }))
}

export default route
