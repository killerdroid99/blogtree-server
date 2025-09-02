import { createId } from '@paralleldrive/cuid2';
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => createId()),
  name: text().notNull(),
  email: text().notNull().unique(),
  provider: text().notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  picture: text().notNull()
});
