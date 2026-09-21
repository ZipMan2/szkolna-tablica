import { z } from 'zod'
import { passwordSchema, usernameSchema } from '../auth/auth.schemas.js'

const role = z.enum(['admin', 'editor'])

export const idParams = z.object({ id: z.string().uuid() })

export const createUserBody = z.object({ username: usernameSchema, password: passwordSchema, role })

export const updateUserBody = z
  .object({ password: passwordSchema.optional(), role: role.optional() })
  .refine(v => v.password || v.role, 'Nothing to update')
