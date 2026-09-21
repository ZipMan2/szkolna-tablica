import { z } from 'zod'

// Safe env parsing
const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  // Add later: DATABASE_URL: z.string().url(), SESSION_SECRET: z.string().min(32)
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform(v => v === 'true'),
  DATABASE_URL: z.string().url(),
  COOKIE_SECRET: z.string().min(32),
  TRUST_PROXY: z
    .enum(['true', 'false'])
    .default('false')
    .transform(v => v === 'true'),
})

// Validate env
const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  console.error('Invalid env:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
export const isDevelopment = env.NODE_ENV === 'development'
