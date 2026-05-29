import { v4 as uuidv4 } from 'uuid';
import { FixedExpensesRepository } from './fixed-expenses.repository.js';
import { NotFoundError } from '../../shared/errors/app-error.js';
import { db } from '../../db/index.js';
import { expenses } from '../../db/schema/index.js';
import type { CreateFixedExpenseInput, UpdateFixedExpenseInput } from './fixed-expenses.schema.js';
import type { FixedExpense } from '../../db/schema/index.js';

export class FixedExpensesService {
  private readonly repo = new FixedExpensesRepository();

  async list(userId: string): Promise<FixedExpense[]> {
    return this.repo.findAllByUser(userId);
  }

  async create(userId: string, input: CreateFixedExpenseInput): Promise<FixedExpense> {
    return this.repo.create({ id: uuidv4(), userId, ...input, isActive: true });
  }

  async update(userId: string, id: string, input: UpdateFixedExpenseInput): Promise<FixedExpense> {
    const existing = await this.repo.findById(id, userId);
    if (!existing) throw new NotFoundError('Fixed expense');
    const patch: Parameters<typeof this.repo.update>[2] = {};
    if (input.description !== undefined) patch.description = input.description;
    if (input.amount !== undefined) patch.amount = input.amount;
    if (input.currency !== undefined) patch.currency = input.currency;
    if (input.category !== undefined) patch.category = input.category;
    if (input.isActive !== undefined) patch.isActive = input.isActive;
    const updated = await this.repo.update(id, userId, patch);
    if (!updated) throw new NotFoundError('Fixed expense');
    return updated;
  }

  async delete(userId: string, id: string): Promise<void> {
    const existing = await this.repo.findById(id, userId);
    if (!existing) throw new NotFoundError('Fixed expense');
    await this.repo.delete(id, userId);
  }

  async applyMonthly(userId: string): Promise<{ applied: number }> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const all = await this.repo.findAllByUser(userId);
    const active = all.filter(f => f.isActive);
    let applied = 0;
    for (const fixed of active) {
      const existing = await this.repo.findAppliedThisMonth(fixed.id, currentMonth);
      if (existing) continue;
      const expenseId = uuidv4();
      await db.insert(expenses).values({
        id: expenseId,
        payerId: userId,
        isPersonal: true,
        date: `${currentMonth}-01`,
        amount: fixed.amount,
        currency: fixed.currency,
        category: fixed.category,
        description: fixed.description,
        paymentMethod: 'transfer',
        notes: 'Auto-recurrente',
        groupId: null,
      });
      await this.repo.markApplied({
        id: uuidv4(),
        fixedExpenseId: fixed.id,
        userId,
        appliedMonth: currentMonth,
        expenseId,
      });
      applied++;
    }
    return { applied };
  }
}
