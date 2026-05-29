import { z } from 'zod';

export const createFixedExpenseSchema = z.object({
  description: z.string().min(1).max(255),
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  category: z.string().min(1).max(50).default('general'),
});

export const updateFixedExpenseSchema = z.object({
  description: z.string().min(1).max(255).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  category: z.string().min(1).max(50).optional(),
  isActive: z.boolean().optional(),
});

export type CreateFixedExpenseInput = z.infer<typeof createFixedExpenseSchema>;
export type UpdateFixedExpenseInput = z.infer<typeof updateFixedExpenseSchema>;
