import { api } from '@/shared/lib/api';
import type { Settlement, BalanceSummary, CreateSettlementPayload } from '@/shared/types';

export const settlementsApi = {
  list: async (groupId?: string) => {
    const res = await api.get<{ success: boolean; data: Settlement[] }>('/settlements', {
      params: groupId ? { groupId } : undefined,
    });
    return res.data.data;
  },
  create: async (data: CreateSettlementPayload) => {
    const res = await api.post<{ success: boolean; data: Settlement }>('/settlements', data);
    return res.data.data;
  },
  getBalances: async () => {
    const res = await api.get<{ success: boolean; data: BalanceSummary }>('/balances');
    return res.data.data;
  },
};
