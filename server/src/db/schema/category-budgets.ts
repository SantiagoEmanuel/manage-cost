import { sqliteTable, text, real, unique } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const categoryBudgets = sqliteTable('category_budgets', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  category: text('category').notNull(),
  limitAmount: real('limit_amount').notNull(),
  currency: text('currency').notNull().default('USD'),
  createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
  updatedAt: text('updated_at').notNull().default(sql`(current_timestamp)`),
}, (t) => [
  unique().on(t.userId, t.category),
]);

export type CategoryBudget = typeof categoryBudgets.$inferSelect;
export type NewCategoryBudget = typeof categoryBudgets.$inferInsert;
