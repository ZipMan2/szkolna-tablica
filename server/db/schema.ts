import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const roleEnum = pgEnum('role', ['admin', 'editor'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull().default('editor'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  t => [index('sessions_user_idx').on(t.userId)],
)

export const screens = pgTable('screens', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  layout: text('layout').notNull().default('one-column'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const blocks = pgTable('blocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  screenId: uuid('screen_id')
    .notNull()
    .references(() => screens.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  slot: text('slot').notNull(),
  data: jsonb('data').notNull().default({}),
  position: integer('position').notNull().default(0),
})
