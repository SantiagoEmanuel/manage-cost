import { api } from '@/shared/lib/api';
import type { Settlement, BalanceSummary } from '@/shared/types';

export const settlementsApi = {
  list: async () => {
    const res = await api.get<{ success: boolean; data: Settlement[] }>('/settlements');
    return res.data.data;
  },
  create: async (data: { debtId: string; amount: number; notes?: string }) => {
    const res = await api.post<{ success: boolean; data: Settlement }>('/settlements', data);
    return res.data.data;
  },
  getBalances: async () => {
    const res = await api.get<{ success: boolean; data: BalanceSummary }>('/balances');
    return res.data.data;
  },
};
