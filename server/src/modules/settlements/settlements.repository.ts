import { eq, and, or, inArray, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { settlements, debts, users, groups } from '../../db/schema/index.js';
import type { NewSettlement } from '../../db/schema/index.js';

export class SettlementsRepository {
  /**
   * Devuelve los pagos donde el usuario participa (como acreedor o deudor),
   * enriquecidos con datos de la deuda, usuarios y grupo para el historial.
   * Si se pasa groupId, limita a ese grupo.
   */
  async findUserSettlements(userId: string, groupId?: string) {
    const debtConds = [or(eq(debts.creditorId, userId), eq(debts.debtorId, userId))];
    if (groupId) debtConds.push(eq(debts.groupId, groupId));
    const userDebts = await db.select().from(debts).where(and(...debtConds));
    if (userDebts.length === 0) return [];

    const debtIds = userDebts.map(d => d.id);
    const setts = await db
      .select()
      .from(settlements)
      .where(inArray(settlements.debtId, debtIds))
      .orderBy(desc(settlements.paidAt));

    // Map de usuarios y grupos involucrados (evita N+1).
    const userIds = new Set<string>();
    const groupIds = new Set<string>();
    for (const d of userDebts) {
      userIds.add(d.creditorId);
      userIds.add(d.debtorId);
      groupIds.add(d.groupId);
    }
    const userList = userIds.size
      ? await db.select().from(users).where(inArray(users.id, [...userIds]))
      : [];
    const groupList = groupIds.size
      ? await db.select().from(groups).where(inArray(groups.id, [...groupIds]))
      : [];
    const userMap = new Map(userList.map(u => [u.id, u.username]));
    const groupMap = new Map(groupList.map(g => [g.id, g.name]));
    const debtMap = new Map(userDebts.map(d => [d.id, d]));

    return setts.map(s => {
      const debt = debtMap.get(s.debtId)!;
      return {
        ...s,
        debt: {
          id: debt.id,
          groupId: debt.groupId,
          groupName: groupMap.get(debt.groupId) ?? '',
          creditorId: debt.creditorId,
          creditorUsername: userMap.get(debt.creditorId) ?? '',
          debtorId: debt.debtorId,
          debtorUsername: userMap.get(debt.debtorId) ?? '',
          amount: debt.amount,
          currency: debt.currency,
          status: debt.status,
        },
      };
    });
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
    await db
      .update(debts)
      .set({ amount: Math.max(0, remaining), status, updatedAt: new Date().toISOString() })
      .where(eq(debts.id, debtId));
  }
}
