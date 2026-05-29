import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const fixedExpenses = sqliteTable('fixed_expenses', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('USD'),
  category: text('category').notNull().default('general'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
  updatedAt: text('updated_at').notNull().default(sql`(current_timestamp)`),
});

export const fixedExpenseApplications = sqliteTable('fixed_expense_applications', {
  id: text('id').primaryKey(),
  fixedExpenseId: text('fixed_expense_id').notNull(),
  userId: text('user_id').notNull(),
  appliedMonth: text('applied_month').notNull(),
  expenseId: text('expense_id').notNull(),
  createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
});

export type FixedExpense = typeof fixedExpenses.$inferSelect;
export type NewFixedExpense = typeof fixedExpenses.$inferInsert;
export type FixedExpenseApplication = typeof fixedExpenseApplications.$inferSelect;
export type NewFixedExpenseApplication = typeof fixedExpenseApplications.$inferInsert;
