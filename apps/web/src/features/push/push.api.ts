import { api } from '@/shared/lib/api';

export const pushApi = {
  getVapidKey: async () => {
    const res = await api.get<{ success: boolean; data: { publicKey: string } }>('/push/vapid-key');
    return res.data.data.publicKey;
  },
  subscribe: async (sub: { endpoint: string; keys: { p256dh: string; auth: string } }) => {
    await api.post('/push/subscribe', sub);
  },
  unsubscribe: async (endpoint: string) => {
    await api.delete('/push/subscribe', { data: { endpoint } });
  },
};
