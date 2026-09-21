import { createHash, randomBytes } from 'node:crypto'
import { lt } from 'drizzle-orm'
import type { FastifyInstance, FastifyReply } from 'fastify'
import { sessions } from '../db/schema.js'
import { env } from '../config/env.js'

export const SESSION_COOKIE = 'sid'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

// We store only the SHA-256 of the token in DB – a DB leak does not expose live sessions
export const hashToken = (t: string) => createHash('sha256').update(t).digest('hex')

export async function startSession(db: FastifyInstance['db'], reply: FastifyReply, userId: string) {
  // 256-bit random token – unguessable
  const token = randomBytes(32).toString('base64url')

  // Opportunistic cleanup of expired sessions
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()))

  await db.insert(sessions).values({
    id: hashToken(token),       // store hash only
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  })

  reply.setCookie(SESSION_COOKIE, token, {
    httpOnly: true,             // not readable by JS
    sameSite: 'strict',         // basic CSRF protection
    secure: env.COOKIE_SECURE,  // true only behind HTTPS
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  })
}
