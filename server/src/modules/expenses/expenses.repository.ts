import { eq, and, isNull, gte, lte, desc, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { expenses, creditInstallments } from '../../db/schema/index.js';
import type { NewExpense } from '../../db/schema/index.js';
import type { ExpenseQuery } from './expenses.schema.js';

export class ExpensesRepository {
  async findAll(userId: string, query: ExpenseQuery) {
    const conditions = [
      eq(expenses.payerId, userId),
      eq(expenses.isPersonal, true),
      isNull(expenses.deletedAt),
    ];
    if (query.category) conditions.push(eq(expenses.category, query.category));
    if (query.paymentMethod) conditions.push(eq(expenses.paymentMethod, query.paymentMethod));
    if (query.from) conditions.push(gte(expenses.date, query.from));
    if (query.to) conditions.push(lte(expenses.date, query.to));
    if (query.search) {
      conditions.push(sql`${expenses.description} LIKE ${'%' + query.search.replace(/[%_\\]/g, '\\$&') + '%'} ESCAPE '\\'`);
    }

    const offset = (query.page - 1) * query.limit;
    const rows = await db.select().from(expenses)
      .where(and(...conditions))
      .orderBy(desc(expenses.date))
      .limit(query.limit)
      .offset(offset);

    const countRows = await db.select({ id: expenses.id }).from(expenses).where(and(...conditions));
    return { rows, total: countRows.length };
  }

  findById(id: string, userId: string) {
    return db.query.expenses.findFirst({
      where: and(eq(expenses.id, id), eq(expenses.payerId, userId), isNull(expenses.deletedAt)),
    });
  }

  async create(data: NewExpense) {
    const [e] = await db.insert(expenses).values(data).returning();
    return e!;
  }

  async update(id: string, userId: string, data: Partial<NewExpense>) {
    const [e] = await db.update(expenses).set({ ...data, updatedAt: new Date().toISOString() })
      .where(and(eq(expenses.id, id), eq(expenses.payerId, userId))).returning();
    return e;
  }

  async softDelete(id: string, userId: string) {
    await db.update(expenses).set({ deletedAt: new Date().toISOString() })
      .where(and(eq(expenses.id, id), eq(expenses.payerId, userId)));
  }

  async createInstallment(data: { id: string; expenseId: string; userId: string; totalAmount: number; installmentAmount: number; totalInstallments: number; closingDate?: string; dueDate?: string }) {
    const [i] = await db.insert(creditInstallments).values(data).returning();
    return i!;
  }

  findInstallment(expenseId: string) {
    return db.query.creditInstallments.findFirst({ where: eq(creditInstallments.expenseId, expenseId) });
  }

  async findAllByUser(userId: string) {
    return db.select().from(expenses)
      .where(and(eq(expenses.payerId, userId), isNull(expenses.deletedAt)));
  }

  async findMonthlyHistory(userId: string, months: number): Promise<{ month: string; total: number }[]> {
    const rows = await db.all<{ month: string; total: number }>(sql`
      SELECT substr(date, 1, 7) as month, SUM(amount) as total
      FROM expenses
      WHERE payer_id = ${userId} AND is_personal = 1 AND deleted_at IS NULL
        AND date >= date('now', ${'-' + (months - 1) + ' months'}, 'start of month')
      GROUP BY substr(date, 1, 7)
      ORDER BY month ASC
    `);
    return rows;
  }
}
