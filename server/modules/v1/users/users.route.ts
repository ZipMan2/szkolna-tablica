import { count, eq } from 'drizzle-orm'
import type { FastifyPluginAsync } from 'fastify'
import { sessions, users } from '../../../db/schema.js'
import { hashPassword } from '../../../lib/password.js'
import { createUserBody, idParams, updateUserBody } from './users.schemas.js'

// Safe user fields to return
const publicCols = { id: users.id, username: users.username, role: users.role, createdAt: users.createdAt }

const route: FastifyPluginAsync = async app => {
  //check if user is admin
  const adminOnly = { preHandler: app.requireRole('admin') }

  // check if user is the last admin
  async function isLastAdmin(id: string) {
    const [target] = await app.db.select({ role: users.role }).from(users).where(eq(users.id, id))
    if (target?.role !== 'admin') return false
    const [{ n }] = await app.db.select({ n: count() }).from(users).where(eq(users.role, 'admin'))
    return n <= 1
  }

  // --- Admin-only routes ---

  // Return all users
  app.get('/users', adminOnly, async () => app.db.select(publicCols).from(users).orderBy(users.username))

  // Create a new user
  app.post('/users', adminOnly, async (req, reply) => {
    const { username, password, role } = createUserBody.parse(req.body)

    // Check if username is available
    const [user] = await app.db
      .insert(users)
      .values({ username, passwordHash: await hashPassword(password), role })
      .onConflictDoNothing({ target: users.username })
      .returning(publicCols)
    if (!user) throw app.httpErrors.conflict('Username already taken')

    return reply.code(201).send(user)
  })

  // Update a user
  app.patch('/users/:id', adminOnly, async req => {
    const { id } = idParams.parse(req.params)

    // Check if role is allowed
    const { password, role } = updateUserBody.parse(req.body)
    if (role === 'editor' && (await isLastAdmin(id))) throw app.httpErrors.conflict('Cannot demote the last admin')

    // Update user
    const [user] = await app.db
      .update(users)
      .set({ ...(role && { role }), ...(password && { passwordHash: await hashPassword(password) }) })
      .where(eq(users.id, id))
      .returning(publicCols)
    if (!user) throw app.httpErrors.notFound()

    // Revoke sessions
    await app.db.delete(sessions).where(eq(sessions.userId, id))
    return user
  })

  // Delete a user
  app.delete('/users/:id', adminOnly, async (req, reply) => {
    const { id } = idParams.parse(req.params)

    // Check if role is allowed
    if (id === req.user!.id) throw app.httpErrors.conflict('You cannot delete yourself')

    // check if user is the last admin
    if (await isLastAdmin(id)) throw app.httpErrors.conflict('Cannot delete the last admin')

    // Delete user
    const deleted = await app.db.delete(users).where(eq(users.id, id)).returning({ id: users.id })
    
    if (!deleted.length) throw app.httpErrors.notFound()
    return reply.code(204).send() // sessions are removed by ON DELETE CASCADE
  })
}

export default route
