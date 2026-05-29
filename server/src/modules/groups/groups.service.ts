import { v4 as uuidv4 } from 'uuid';
import { GroupsRepository } from './groups.repository.js';
import { UsersRepository } from '../users/users.repository.js';
import { PushService } from '../push/push.service.js';
import { NotFoundError, ForbiddenError, ConflictError } from '../../shared/errors/app-error.js';
import type { CreateGroupInput, UpdateGroupInput, InviteInput, CreateGroupExpenseInput, UpdateGroupExpenseInput } from './groups.schema.js';
import type { GroupDto, GroupMemberDto, GroupExpenseDto } from './groups.dto.js';
import type { Group } from '../../db/schema/index.js';

function toGroupDto(g: Group, members: GroupMemberDto[] = []): GroupDto {
  return {
    id: g.id, name: g.name, description: g.description,
    currency: g.currency, ownerId: g.ownerId, createdAt: g.createdAt,
    members,
  };
}

export class GroupsService {
  private readonly repo = new GroupsRepository();
  private readonly usersRepo = new UsersRepository();
  private readonly pushService = new PushService();

  async list(userId: string): Promise<GroupDto[]> {
    const gs = await this.repo.findAllByUser(userId);
    return gs.map(g => toGroupDto(g));
  }

  async getById(groupId: string, userId: string): Promise<GroupDto> {
    const g = await this.repo.findById(groupId);
    if (!g) throw new NotFoundError('Group');
    const membership = await this.repo.findMembership(groupId, userId);
    if (!membership) throw new ForbiddenError('Not a member of this group');
    const members = await this.repo.getMembers(groupId);
    return toGroupDto(g, members.map(m => ({
      id: m.id, userId: m.userId, username: m.username,
      email: m.email, avatarUrl: m.avatarUrl, role: m.role, joinedAt: m.joinedAt,
    })));
  }

  async create(userId: string, input: CreateGroupInput): Promise<GroupDto> {
    const id = uuidv4();
    const g = await this.repo.create({ id, name: input.name, description: input.description ?? null, ownerId: userId, currency: input.currency });
    await this.repo.addMember({ id: uuidv4(), groupId: id, userId, role: 'owner' });
    return toGroupDto(g);
  }

  async update(groupId: string, userId: string, input: UpdateGroupInput): Promise<GroupDto> {
    const g = await this.repo.findById(groupId);
    if (!g) throw new NotFoundError('Group');
    if (g.ownerId !== userId) throw new ForbiddenError('Only owner can update group');
    const patch: { name?: string; description?: string | null } = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description ?? null;
    const updated = await this.repo.update(groupId, patch);
    if (!updated) throw new NotFoundError('Group');
    return toGroupDto(updated);
  }

  async delete(groupId: string, userId: string): Promise<void> {
    const g = await this.repo.findById(groupId);
    if (!g) throw new NotFoundError('Group');
    if (g.ownerId !== userId) throw new ForbiddenError('Only owner can delete group');
    await this.repo.softDelete(groupId);
  }

  async invite(groupId: string, requesterId: string, input: InviteInput): Promise<GroupMemberDto> {
    const g = await this.repo.findById(groupId);
    if (!g) throw new NotFoundError('Group');
    const requesterMembership = await this.repo.findMembership(groupId, requesterId);
    if (!requesterMembership || !['owner', 'admin'].includes(requesterMembership.role)) {
      throw new ForbiddenError('Only owner or admin can invite');
    }
    const invitee = await this.usersRepo.findByEmail(input.email);
    if (!invitee) throw new NotFoundError('User with that email');
    const existing = await this.repo.findMembership(groupId, invitee.id);
    if (existing) throw new ConflictError('User is already a member');
    const member = await this.repo.addMember({ id: uuidv4(), groupId, userId: invitee.id, role: 'member' });
    return {
      id: member.id, userId: invitee.id, username: invitee.username,
      email: invitee.email, avatarUrl: invitee.avatarUrl, role: member.role, joinedAt: member.joinedAt,
    };
  }

  async removeMember(groupId: string, requesterId: string, targetUserId: string): Promise<void> {
    const g = await this.repo.findById(groupId);
    if (!g) throw new NotFoundError('Group');
    const requesterMembership = await this.repo.findMembership(groupId, requesterId);
    if (!requesterMembership || !['owner', 'admin'].includes(requesterMembership.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    if (targetUserId === g.ownerId) throw new ForbiddenError('Cannot remove group owner');
    await this.repo.removeMember(groupId, targetUserId);
  }

  async listGroupExpenses(groupId: string, userId: string): Promise<GroupExpenseDto[]> {
    const membership = await this.repo.findMembership(groupId, userId);
    if (!membership) throw new ForbiddenError('Not a member');
    const exps = await this.repo.getGroupExpenses(groupId);
    const result: GroupExpenseDto[] = [];
    for (const e of exps) {
      const payer = await this.usersRepo.findById(e.payerId);
      const splits = await this.repo.getExpenseSplits(e.id);
      result.push({
        id: e.id, groupId, payerId: e.payerId, payerUsername: payer?.username ?? '',
        amount: e.amount, currency: e.currency, description: e.description,
        category: e.category, paymentMethod: e.paymentMethod, date: e.date,
        notes: e.notes, createdAt: e.createdAt,
        splits: splits.map(s => ({ userId: s.userId, username: s.username, amount: s.amount })),
      });
    }
    return result;
  }

  async createGroupExpense(groupId: string, payerId: string, input: CreateGroupExpenseInput): Promise<GroupExpenseDto> {
    const g = await this.repo.findById(groupId);
    if (!g) throw new NotFoundError('Group');
    const membership = await this.repo.findMembership(groupId, payerId);
    if (!membership) throw new ForbiddenError('Not a member');

    const members = await this.repo.getMembers(groupId);
    const expId = uuidv4();
    const expense = await this.repo.createGroupExpense({
      id: expId, groupId, payerId, amount: input.amount, currency: input.currency,
      description: input.description, category: input.category,
      paymentMethod: input.paymentMethod, isPersonal: false,
      date: input.date, notes: input.notes ?? null,
    });

    const splits: { userId: string; username: string; amount: number }[] = [];
    if (input.splitType === 'equal') {
      const share = input.amount / members.length;
      for (const m of members) {
        await this.repo.createSplit({ id: uuidv4(), expenseId: expId, userId: m.userId, amount: share });
        if (m.userId !== payerId) {
          await this.repo.upsertDebt({ id: uuidv4(), groupId, creditorId: payerId, debtorId: m.userId, amount: share, currency: input.currency });
        }
        splits.push({ userId: m.userId, username: m.username, amount: share });
      }
    } else if (input.splits && input.splits.length > 0) {
      for (const split of input.splits) {
        const amount = input.splitType === 'percentage' ? (input.amount * split.value) / 100 : split.value;
        await this.repo.createSplit({ id: uuidv4(), expenseId: expId, userId: split.userId, amount });
        if (split.userId !== payerId) {
          await this.repo.upsertDebt({ id: uuidv4(), groupId, creditorId: payerId, debtorId: split.userId, amount, currency: input.currency });
        }
        const member = members.find(m => m.userId === split.userId);
        splits.push({ userId: split.userId, username: member?.username ?? '', amount });
      }
    }

    const payer = await this.usersRepo.findById(payerId);

    // Fire-and-forget push notification to non-payer members; never block/break expense creation.
    try {
      for (const m of members) {
        if (m.userId === payerId) continue;
        void this.pushService.sendToUser(m.userId, {
          title: `Nuevo gasto en ${g.name}`,
          body: `${payer?.username ?? ''} agregó ${input.description}`,
          url: `/groups/${groupId}`,
        }).catch(() => undefined);
      }
    } catch {
      // ignore push failures
    }

    return {
      id: expense.id, groupId, payerId, payerUsername: payer?.username ?? '',
      amount: expense.amount, currency: expense.currency, description: expense.description,
      category: expense.category, paymentMethod: expense.paymentMethod, date: expense.date,
      notes: expense.notes, createdAt: expense.createdAt, splits,
    };
  }

  async simplifyDebts(groupId: string, requesterId: string): Promise<{ simplified: number; skippedCurrencies: string[] }> {
    const g = await this.repo.findById(groupId);
    if (!g) throw new NotFoundError('Group');
    if (g.ownerId !== requesterId) throw new ForbiddenError('Only owner can simplify debts');

    const groupDebts = await this.repo.getGroupDebts(groupId);

    // Group non-paid debts by currency
    const byCurrency = new Map<string, typeof groupDebts>();
    for (const d of groupDebts) {
      const bucket = byCurrency.get(d.currency) ?? [];
      bucket.push(d);
      byCurrency.set(d.currency, bucket);
    }

    // Determine which currencies have any settled debt BEFORE deleting anything;
    // those currencies are skipped entirely (left untouched).
    const settledDebtIds = new Set(await this.repo.findSettledDebtIds(groupId));
    const skippedCurrencies = new Set<string>();
    for (const d of groupDebts) {
      if (settledDebtIds.has(d.id)) skippedCurrencies.add(d.currency);
    }

    // Only clear unsettled debts in currencies we will actually rebuild.
    const currenciesToSimplify = new Set(
      [...byCurrency.keys()].filter(c => !skippedCurrencies.has(c)),
    );
    await this.repo.clearUnsettledGroupDebts(groupId, currenciesToSimplify);

    let simplified = 0;
    for (const [currency, bucket] of byCurrency) {
      // Only simplify currencies fully cleared (no debt with settlements).
      if (skippedCurrencies.has(currency)) continue;

      // Net per user: creditor +amount, debtor -amount
      const net = new Map<string, number>();
      for (const d of bucket) {
        net.set(d.creditorId, (net.get(d.creditorId) ?? 0) + d.amount);
        net.set(d.debtorId, (net.get(d.debtorId) ?? 0) - d.amount);
      }

      const creditors: { id: string; amount: number }[] = [];
      const debtors: { id: string; amount: number }[] = [];
      for (const [id, amount] of net) {
        if (amount > 0.01) creditors.push({ id, amount });
        else if (amount < -0.01) debtors.push({ id, amount: -amount });
      }

      // Greedy two-pointer minimal settlement
      let i = 0;
      let j = 0;
      while (i < creditors.length && j < debtors.length) {
        const creditor = creditors[i]!;
        const debtor = debtors[j]!;
        const pay = Math.min(creditor.amount, debtor.amount);
        if (pay > 0.01) {
          await this.repo.upsertDebt({
            id: uuidv4(), groupId, creditorId: creditor.id, debtorId: debtor.id, amount: pay, currency,
          });
          simplified++;
        }
        creditor.amount -= pay;
        debtor.amount -= pay;
        if (creditor.amount <= 0.01) i++;
        if (debtor.amount <= 0.01) j++;
      }
    }

    return { simplified, skippedCurrencies: [...skippedCurrencies] };
  }

  async updateGroupExpense(groupId: string, expenseId: string, userId: string, input: UpdateGroupExpenseInput): Promise<GroupExpenseDto> {
    const membership = await this.repo.findMembership(groupId, userId);
    if (!membership) throw new ForbiddenError('Not a member');
    const expense = await this.repo.findGroupExpense(expenseId, groupId);
    if (!expense) throw new NotFoundError('Expense');
    if (expense.payerId !== userId) throw new ForbiddenError('Only the payer can edit this expense');
    const updated = await this.repo.updateGroupExpense(expenseId, input);
    if (!updated) throw new NotFoundError('Expense');
    const payer = await this.usersRepo.findById(updated.payerId);
    const splits = await this.repo.getExpenseSplits(updated.id);
    return {
      id: updated.id, groupId, payerId: updated.payerId, payerUsername: payer?.username ?? '',
      amount: updated.amount, currency: updated.currency, description: updated.description,
      category: updated.category, paymentMethod: updated.paymentMethod, date: updated.date,
      notes: updated.notes, createdAt: updated.createdAt,
      splits: splits.map(s => ({ userId: s.userId, username: s.username, amount: s.amount })),
    };
  }

  async deleteGroupExpense(groupId: string, expenseId: string, userId: string): Promise<void> {
    const membership = await this.repo.findMembership(groupId, userId);
    if (!membership) throw new ForbiddenError('Not a member');
    const expense = await this.repo.findGroupExpense(expenseId, groupId);
    if (!expense) throw new NotFoundError('Expense');
    const g = await this.repo.findById(groupId);
    if (expense.payerId !== userId && g?.ownerId !== userId) throw new ForbiddenError('Insufficient permissions');
    await this.repo.softDeleteGroupExpense(expenseId);
  }
}
