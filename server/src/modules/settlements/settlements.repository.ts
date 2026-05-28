import { eq, and, or } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { settlements, debts } from '../../db/schema/index.js';
import type { NewSettlement } from '../../db/schema/index.js';

export class SettlementsRepository {
  async findUserSettlements(userId: string) {
    const userDebts = await db.select().from(debts).where(or(eq(debts.creditorId, userId), eq(debts.debtorId, userId)));
    const result = [];
    for (const d of userDebts) {
      const setts = await db.select().from(settlements).where(eq(settlements.debtId, d.id));
      for (const s of setts) result.push({ ...s, debt: d });
    }
    return result;
  }

  findById(id: string) {
    return db.query.settlements.findFirst({ where: eq(settlements.id, id) });
  }

  findDebtById(id: string) {
    return db.query.debts.findFirst({ where: eq(debts.id, id) });
  }

  async create(data: NewSettlement) {
    const [s] = await db.insert(settlements).values(data).returning();
    return s!;
  }

  async updateDebtAfterSettlement(debtId: string, paidAmount: number) {
    const debt = await db.query.debts.findFirst({ where: eq(debts.id, debtId) });
    if (!debt) return;
    const remaining = debt.amount - paidAmount;
    const status = remaining <= 0 ? 'paid' : 'partial';
    await db.update(debts).set({ amount: Math.max(0, remaining), status, updatedAt: new Date().toISOString() }).where(eq(debts.id, debtId));
  }
}
