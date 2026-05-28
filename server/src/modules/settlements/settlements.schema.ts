import { z } from 'zod';

export const createSettlementSchema = z.object({
  debtId: z.string().uuid(),
  amount: z.number().positive(),
  notes: z.string().max(500).optional(),
  receiptUrl: z.string().url().optional().nullable(),
});

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
