import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { groups, groupMembers, expenses, expenseSplits, users, debts } from '../../db/schema/index.js';
import type { NewGroup, NewGroupMember, NewExpense, NewExpenseSplit } from '../../db/schema/index.js';


export class GroupsRepository {
  async findAllByUser(userId: string) {
    const memberships = await db.query.groupMembers.findMany({ where: eq(groupMembers.userId, userId) });
    const groupIds = memberships.map(m => m.groupId);
    if (groupIds.length === 0) return [];
    const result = [];
    for (const gid of groupIds) {
      const g = await db.query.groups.findFirst({ where: and(eq(groups.id, gid), isNull(groups.deletedAt)) });
      if (g) result.push(g);
    }
    return result;
  }

  findById(id: string) {
    return db.query.groups.findFirst({ where: and(eq(groups.id, id), isNull(groups.deletedAt)) });
  }

  async create(data: NewGroup) {
    const [g] = await db.insert(groups).values(data).returning();
    return g!;
  }

  async update(id: string, data: Partial<NewGroup>) {
    const [g] = await db.update(groups).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(groups.id, id)).returning();
    return g;
  }

  async softDelete(id: string) {
    await db.update(groups).set({ deletedAt: new Date().toISOString() }).where(eq(groups.id, id));
  }

  async getMembers(groupId: string) {
    const members = await db.query.groupMembers.findMany({ where: eq(groupMembers.groupId, groupId) });
    const result = [];
    for (const m of members) {
      const user = await db.query.users.findFirst({ where: eq(users.id, m.userId) });
      if (user) result.push({ ...m, username: user.username, email: user.email, avatarUrl: user.avatarUrl });
    }
    return result;
  }

  async addMember(data: NewGroupMember) {
    const [m] = await db.insert(groupMembers).values(data).returning();
    return m!;
  }

  findMembership(groupId: string, userId: string) {
    return db.query.groupMembers.findFirst({ where: and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)) });
  }

  async removeMember(groupId: string, userId: string) {
    await db.delete(groupMembers).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
  }

  async getGroupExpenses(groupId: string) {
    return db.select().from(expenses)
      .where(and(eq(expenses.groupId, groupId), isNull(expenses.deletedAt)));
  }

  async getExpenseSplits(expenseId: string) {
    const splits = await db.query.expenseSplits.findMany({ where: eq(expenseSplits.expenseId, expenseId) });
    const result = [];
    for (const s of splits) {
      const user = await db.query.users.findFirst({ where: eq(users.id, s.userId) });
      result.push({ ...s, username: user?.username ?? '' });
    }
    return result;
  }

  async createGroupExpense(data: NewExpense) {
    const [e] = await db.insert(expenses).values(data).returning();
    return e!;
  }

  async createSplit(data: NewExpenseSplit) {
    const [s] = await db.insert(expenseSplits).values(data).returning();
    return s!;
  }

  findGroupExpense(expenseId: string, groupId: string) {
    return db.query.expenses.findFirst({ where: and(eq(expenses.id, expenseId), eq(expenses.groupId, groupId), isNull(expenses.deletedAt)) });
  }

  async softDeleteGroupExpense(expenseId: string) {
    await db.update(expenses).set({ deletedAt: new Date().toISOString() }).where(eq(expenses.id, expenseId));
  }

  async upsertDebt(data: { id: string; groupId: string; creditorId: string; debtorId: string; amount: number; currency: string }) {
    const existing = await db.query.debts.findFirst({
      where: and(eq(debts.groupId, data.groupId), eq(debts.creditorId, data.creditorId), eq(debts.debtorId, data.debtorId)),
    });
    if (existing) {
      const newAmount = existing.amount + data.amount;
      await db.update(debts).set({ amount: newAmount, updatedAt: new Date().toISOString() }).where(eq(debts.id, existing.id));
    } else {
      await db.insert(debts).values({ ...data, status: 'pending' });
    }
  }
}
