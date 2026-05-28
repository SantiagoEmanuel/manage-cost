import { api } from '@/shared/lib/api';
import type { User } from '@/shared/types';

export interface LoginInput { email: string; password: string; }
export interface RegisterInput { email: string; username: string; password: string; }

export const authApi = {
  login: async (data: LoginInput): Promise<User> => {
    const res = await api.post<{ success: boolean; data: { user: User } }>('/auth/login', data);
    return res.data.data.user;
  },
  register: async (data: RegisterInput): Promise<{ id: string; email: string; username: string }> => {
    const res = await api.post<{ success: boolean; data: { user: { id: string; email: string; username: string } } }>('/auth/register', data);
    return res.data.data.user;
  },
  logout: async () => {
    await api.post('/auth/logout');
  },
  me: async (): Promise<User> => {
    const res = await api.get<{ success: boolean; data: { user: User } }>('/auth/me');
    return res.data.data.user;
  },
};
