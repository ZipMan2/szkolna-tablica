import { eq } from 'drizzle-orm'
import type { FastifyPluginAsync } from 'fastify'
import { screens } from '../../../db/schema.js'
import { createScreenBody, idParams, slugify, updateScreenBody } from './screens.schemas.js'

const route: FastifyPluginAsync = async app => {
  // Only logged user can manage screens
  app.addHook('preHandler', app.authenticate)

  // --- Public authorized routes ---

  // Return all screens
  app.get('/screens', async () => app.db.select().from(screens).orderBy(screens.createdAt))

  // Return a specific screen
  app.get('/screens/:id', async req => {
    const { id } = idParams.parse(req.params)

    const [screen] = await app.db.select().from(screens).where(eq(screens.id, id))

    if (!screen) throw app.httpErrors.notFound()
    return screen
  })

  // Create a new screen
  app.post('/screens', async (req, reply) => {
    const { name, layout } = createScreenBody.parse(req.body)

    // Convert the screen name into a URL slug
    const base = slugify(name) || 'ekran'

    // Try the base slug first, then add a number if it already exists.
    for (let i = 0; i < 5; i++) {
      const slug = i === 0 ? base : `${base}-${i + 1}`

      // Insert the screen only if the slug is still available.
      const [screen] = await app.db
        .insert(screens)
        .values({ name, layout, slug })
        .onConflictDoNothing({ target: screens.slug })
        .returning()

      if (screen) return reply.code(201).send(screen)
    }
    // Stop after 5 attempts if no unique slug was found.
    throw app.httpErrors.conflict('Could not generate a unique slug, try a different name')
  })

  // Update a screen
  app.patch('/screens/:id', async req => {
    const { id } = idParams.parse(req.params)
    const body = updateScreenBody.parse(req.body)

    // Update screen
    const [screen] = await app.db.update(screens).set(body).where(eq(screens.id, id)).returning()
    if (!screen) throw app.httpErrors.notFound()
    // TODO: once WS is ready, notify /ws/display?screen=<slug> so the kiosk reloads the new layout
    return screen
  })

  // Delete a screen
  app.delete('/screens/:id', async (req, reply) => {
    const { id } = idParams.parse(req.params)

    const deleted = await app.db.delete(screens).where(eq(screens.id, id)).returning({ id: screens.id })
    if (!deleted.length) throw app.httpErrors.notFound()

    return reply.code(204).send()
  })
}

export default route
