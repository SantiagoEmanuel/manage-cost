import { api } from '@/shared/lib/api';
import type { CategoryBudget } from '@/shared/types';

export interface UpsertCategoryBudgetInput {
  category: string;
  limitAmount: number;
  currency: string;
}

export const categoryBudgetsApi = {
  list: async () => {
    const res = await api.get<{ success: boolean; data: CategoryBudget[] }>('/category-budgets');
    return res.data.data;
  },
  upsert: async (data: UpsertCategoryBudgetInput) => {
    const res = await api.put<{ success: boolean; data: CategoryBudget }>('/category-budgets', data);
    return res.data.data;
  },
  delete: async (id: string) => {
    await api.delete(`/category-budgets/${id}`);
  },
};
