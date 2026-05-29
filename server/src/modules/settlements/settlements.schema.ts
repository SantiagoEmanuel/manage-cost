import { z } from 'zod';

export const PAYMENT_METHODS = ['cash', 'debit', 'credit', 'transfer', 'digital_wallet'] as const;

export const createSettlementSchema = z.object({
  debtId: z.string().uuid(),
  amount: z.number().positive(),
  paymentMethod: z.enum(PAYMENT_METHODS).default('cash'),
  reference: z.string().max(200).optional().nullable(),
  paidAt: z.string().min(1).optional(),
  notes: z.string().max(500).optional().nullable(),
  receiptUrl: z.string().url().optional().nullable(),
});

export const settlementQuerySchema = z.object({
  groupId: z.string().uuid().optional(),
});

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
export type SettlementQuery = z.infer<typeof settlementQuerySchema>;
