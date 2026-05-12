import { sqliteTable, text, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';
import { groups } from './groups.js';

export const debts = sqliteTable('debts', {
  id: text('id').primaryKey(),
  groupId: text('group_id')
    .notNull()
    .references(() => groups.id, { onDelete: 'cascade' }),
  creditorId: text('creditor_id')
    .notNull()
    .references(() => users.id),
  debtorId: text('debtor_id')
    .notNull()
    .references(() => users.id),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('USD'),
  status: text('status', { enum: ['pending', 'partial', 'paid', 'overdue'] })
    .notNull()
    .default('pending'),
  createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
  updatedAt: text('updated_at').notNull().default(sql`(current_timestamp)`),
});

export const settlements = sqliteTable('settlements', {
  id: text('id').primaryKey(),
  debtId: text('debt_id')
    .notNull()
    .references(() => debts.id),
  paidBy: text('paid_by')
    .notNull()
    .references(() => users.id),
  amount: real('amount').notNull(),
  notes: text('notes'),
  receiptUrl: text('receipt_url'),
  createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
});

export type Debt = typeof debts.$inferSelect;
export type NewDebt = typeof debts.$inferInsert;
export type Settlement = typeof settlements.$inferSelect;
export type NewSettlement = typeof settlements.$inferInsert;
