import { api } from '@/shared/lib/api';
import type { FixedExpense } from '@/shared/types';

export interface CreateFixedExpenseInput {
  description: string;
  amount: number;
  currency?: string;
  category?: string;
}

export const fixedExpensesApi = {
  list: async () => {
    const res = await api.get<{ success: boolean; data: FixedExpense[] }>('/fixed-expenses');
    return res.data.data;
  },
  create: async (data: CreateFixedExpenseInput) => {
    const res = await api.post<{ success: boolean; data: FixedExpense }>('/fixed-expenses', data);
    return res.data.data;
  },
  update: async (id: string, data: Partial<CreateFixedExpenseInput & { isActive: boolean }>) => {
    const res = await api.patch<{ success: boolean; data: FixedExpense }>(`/fixed-expenses/${id}`, data);
    return res.data.data;
  },
  delete: async (id: string) => {
    await api.delete(`/fixed-expenses/${id}`);
  },
  applyMonthly: async () => {
    const res = await api.post<{ success: boolean; data: { applied: number } }>('/fixed-expenses/apply-monthly');
    return res.data.data;
  },
};
