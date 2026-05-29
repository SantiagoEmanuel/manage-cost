import { v4 as uuidv4 } from 'uuid';
import { CategoryBudgetsRepository } from './category-budgets.repository.js';
import { NotFoundError } from '../../shared/errors/app-error.js';
import type { CreateCategoryBudgetInput } from './category-budgets.schema.js';
import type { CategoryBudget } from '../../db/schema/index.js';

export class CategoryBudgetsService {
  private readonly repo = new CategoryBudgetsRepository();

  async list(userId: string): Promise<CategoryBudget[]> {
    return this.repo.findAllByUser(userId);
  }

  async upsert(userId: string, input: CreateCategoryBudgetInput): Promise<CategoryBudget> {
    return this.repo.upsert({
      id: uuidv4(),
      userId,
      category: input.category,
      limitAmount: input.limitAmount,
      currency: input.currency,
    });
  }

  async delete(userId: string, id: string): Promise<void> {
    const existing = await this.repo.findById(id, userId);
    if (!existing) throw new NotFoundError('Category budget');
    await this.repo.delete(id, userId);
  }
}
