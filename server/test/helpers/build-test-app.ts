import { buildApp } from '../../app.js'

export async function makeApp() {
  const app = await buildApp()
  await app.ready()
  return app
}
