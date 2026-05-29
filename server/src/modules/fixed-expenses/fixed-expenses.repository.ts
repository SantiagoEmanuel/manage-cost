import { eq, and } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { fixedExpenses } from '../../db/schema/index.js';
import type { NewFixedExpense } from '../../db/schema/index.js';

export class FixedExpensesRepository {
  findAllByUser(userId: string) {
    return db.select().from(fixedExpenses).where(eq(fixedExpenses.userId, userId));
  }

  findById(id: string, userId: string) {
    return db.query.fixedExpenses.findFirst({
      where: and(eq(fixedExpenses.id, id), eq(fixedExpenses.userId, userId)),
    });
  }

  async create(data: NewFixedExpense) {
    const [e] = await db.insert(fixedExpenses).values(data).returning();
    return e!;
  }

  async update(id: string, userId: string, data: Partial<NewFixedExpense>) {
    const [e] = await db.update(fixedExpenses)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(and(eq(fixedExpenses.id, id), eq(fixedExpenses.userId, userId)))
      .returning();
    return e;
  }

  async delete(id: string, userId: string) {
    await db.delete(fixedExpenses).where(and(eq(fixedExpenses.id, id), eq(fixedExpenses.userId, userId)));
  }
}
