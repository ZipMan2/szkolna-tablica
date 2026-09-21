import { z } from 'zod'

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(32)
  .regex(/^[a-z0-9._-]+$/)
  
export const passwordSchema = z.string().min(8).max(128) // max protects argon2 from huge inputs

export const loginBody = z.object({
  username: z.string().trim().toLowerCase().max(64),
  password: z.string().max(128),
})

export const setupBody = z.object({
  username: usernameSchema,
  password: passwordSchema,
  setupCode: z.string().max(64),
})
