import { eq, and, or } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { debts, users, groups } from '../../db/schema/index.js';

export class BalancesRepository {
  async findUserDebts(userId: string) {
    const rows = await db.select({
      id: debts.id, groupId: debts.groupId, creditorId: debts.creditorId,
      debtorId: debts.debtorId, amount: debts.amount, currency: debts.currency,
      status: debts.status, createdAt: debts.createdAt, updatedAt: debts.updatedAt,
    })
      .from(debts)
      .where(and(or(eq(debts.creditorId, userId), eq(debts.debtorId, userId))));

    const result = [];
    for (const d of rows) {
      if (d.status === 'paid') continue;
      const creditor = await db.query.users.findFirst({ where: eq(users.id, d.creditorId) });
      const debtor = await db.query.users.findFirst({ where: eq(users.id, d.debtorId) });
      const group = await db.query.groups.findFirst({ where: eq(groups.id, d.groupId) });
      result.push({ ...d, creditorUsername: creditor?.username ?? '', debtorUsername: debtor?.username ?? '', groupName: group?.name ?? '' });
    }
    return result;
  }

  async findGroupDebts(groupId: string, userId: string) {
    const rows = await db.select().from(debts)
      .where(and(eq(debts.groupId, groupId), or(eq(debts.creditorId, userId), eq(debts.debtorId, userId))));

    const result = [];
    for (const d of rows) {
      if (d.status === 'paid') continue;
      const creditor = await db.query.users.findFirst({ where: eq(users.id, d.creditorId) });
      const debtor = await db.query.users.findFirst({ where: eq(users.id, d.debtorId) });
      result.push({ ...d, creditorUsername: creditor?.username ?? '', debtorUsername: debtor?.username ?? '' });
    }
    return result;
  }
}
