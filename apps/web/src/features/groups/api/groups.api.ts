import { api } from '@/shared/lib/api';
import type { Group, GroupExpense, BalanceSummary } from '@/shared/types';

export const groupsApi = {
  list: async () => {
    const res = await api.get<{ success: boolean; data: Group[] }>('/groups');
    return res.data.data;
  },
  getById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: Group }>(`/groups/${id}`);
    return res.data.data;
  },
  create: async (data: { name: string; description?: string; currency?: string }) => {
    const res = await api.post<{ success: boolean; data: Group }>('/groups', data);
    return res.data.data;
  },
  invite: async (groupId: string, email: string) => {
    const res = await api.post(`/groups/${groupId}/invite`, { email });
    return res.data;
  },
  removeMember: async (groupId: string, userId: string) => {
    await api.delete(`/groups/${groupId}/members/${userId}`);
  },
  listExpenses: async (groupId: string) => {
    const res = await api.get<{ success: boolean; data: GroupExpense[] }>(`/groups/${groupId}/expenses`);
    return res.data.data;
  },
  createExpense: async (groupId: string, data: { amount: number; description: string; currency?: string; category?: string; paymentMethod?: string; date: string; notes?: string; splitType?: string; splits?: { userId: string; value: number }[] }) => {
    const res = await api.post<{ success: boolean; data: GroupExpense }>(`/groups/${groupId}/expenses`, data);
    return res.data.data;
  },
  simplifyDebts: async (groupId: string) => {
    const res = await api.post<{ success: boolean; data: { simplified: number; skippedCurrencies: string[] } }>(`/groups/${groupId}/simplify-debts`);
    return res.data.data;
  },
  updateExpense: async (groupId: string, expId: string, data: { description?: string; currency?: string; date?: string }) => {
    const res = await api.patch<{ success: boolean; data: GroupExpense }>(`/groups/${groupId}/expenses/${expId}`, data);
    return res.data.data;
  },
  deleteExpense: async (groupId: string, expId: string) => {
    await api.delete(`/groups/${groupId}/expenses/${expId}`);
  },
  getBalances: async (groupId: string) => {
    const res = await api.get<{ success: boolean; data: BalanceSummary }>(`/balances/groups/${groupId}`);
    return res.data.data;
  },
};
