import { api } from '@/shared/lib/api';
import type { Expense, ExpenseStats } from '@/shared/types';

export interface CreateExpenseInput {
  amount: number;
  currency?: string;
  description: string;
  category?: string;
  paymentMethod?: string;
  date: string;
  notes?: string;
  receiptUrl?: string;
  installments?: number;
}

export interface ExpenseFilters {
  page?: number;
  limit?: number;
  category?: string;
  paymentMethod?: string;
  from?: string;
  to?: string;
}

export const expensesApi = {
  list: async (filters: ExpenseFilters = {}) => {
    const res = await api.get<{ success: boolean; data: Expense[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>('/expenses', { params: filters });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: Expense }>(`/expenses/${id}`);
    return res.data.data;
  },
  create: async (data: CreateExpenseInput) => {
    const res = await api.post<{ success: boolean; data: Expense }>('/expenses', data);
    return res.data.data;
  },
  update: async (id: string, data: Partial<CreateExpenseInput>) => {
    const res = await api.patch<{ success: boolean; data: Expense }>(`/expenses/${id}`, data);
    return res.data.data;
  },
  delete: async (id: string) => {
    await api.delete(`/expenses/${id}`);
  },
  getStats: async () => {
    const res = await api.get<{ success: boolean; data: ExpenseStats }>('/expenses/stats');
    return res.data.data;
  },
};
