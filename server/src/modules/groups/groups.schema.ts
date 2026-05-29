import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  currency: z.string().length(3).default('USD'),
});

export const updateGroupSchema = createGroupSchema.partial();

export const inviteSchema = z.object({
  email: z.string().email(),
});

export const invitationActionSchema = z.object({
  action: z.enum(['accept', 'reject']),
});

export const createGroupExpenseSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  description: z.string().min(1).max(255),
  category: z.string().min(1).max(50).default('general'),
  paymentMethod: z.enum(['cash', 'debit', 'credit', 'transfer', 'digital_wallet']).default('cash'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(1000).optional(),
  splitType: z.enum(['equal', 'percentage', 'amount']).default('equal'),
  splits: z.array(z.object({
    userId: z.string().uuid(),
    value: z.number().positive(),
  })).optional(),
});

export const updateGroupExpenseSchema = z.object({
  description: z.string().min(1).max(255).optional(),
  currency: z.string().length(3).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type InviteInput = z.infer<typeof inviteSchema>;
export type CreateGroupExpenseInput = z.infer<typeof createGroupExpenseSchema>;
export type UpdateGroupExpenseInput = z.infer<typeof updateGroupExpenseSchema>;
