import { z } from 'zod';

export const createCategoryBudgetSchema = z.object({
  category: z.string().min(1).max(50),
  limitAmount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
});

export const updateCategoryBudgetSchema = createCategoryBudgetSchema.partial();

export type CreateCategoryBudgetInput = z.infer<typeof createCategoryBudgetSchema>;
export type UpdateCategoryBudgetInput = z.infer<typeof updateCategoryBudgetSchema>;
