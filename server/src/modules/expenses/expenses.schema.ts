import { z } from 'zod';

const paymentMethodEnum = z.enum(['cash', 'debit', 'credit', 'transfer', 'digital_wallet']);

export const createExpenseSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  description: z.string().min(1).max(255),
  category: z.string().min(1).max(50).default('general'),
  paymentMethod: paymentMethodEnum.default('cash'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  notes: z.string().max(1000).optional(),
  receiptUrl: z.string().url().optional().nullable(),
  installments: z.number().int().min(1).max(60).optional(),
  closingDate: z.string().optional(),
  dueDate: z.string().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const expenseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().optional(),
  paymentMethod: paymentMethodEnum.optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const attachmentSchema = z.object({
  url: z.string().url(),
  name: z.string().min(1).max(255),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseQuery = z.infer<typeof expenseQuerySchema>;
