import { v4 as uuidv4 } from 'uuid';
import { FixedExpensesRepository } from './fixed-expenses.repository.js';
import { NotFoundError } from '../../shared/errors/app-error.js';
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
}
