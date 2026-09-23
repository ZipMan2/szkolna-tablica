import { z } from 'zod'

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const idParams = z.object({ id: z.string().uuid() })

export const createScreenBody = z.object({
  name: z.string().trim().min(1).max(80),
  layout: z.string().min(1).max(50),
})

export const updateScreenBody = z
  .object({ name: z.string().trim().min(1).max(80).optional(), layout: z.string().min(1).max(50).optional() })
  .refine(v => v.name || v.layout, 'Nothing to update')

export { slugify }
