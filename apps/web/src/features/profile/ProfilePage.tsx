import { useQuery, useMutation } from '@tanstack/react-query';
import { PageMeta } from '@/shared/components/PageMeta';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { api } from '@/shared/lib/api';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/features/auth/auth.store';
import { queryClient } from '@/shared/lib/query-client';
import { Card, CardHeader, CardTitle } from '@/shared/components/Card';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { PageSpinner } from '@/shared/components/Spinner';
import { toast } from '@/shared/components/Toast';
import type { User } from '@/shared/types';

const profileSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional().or(z.literal('')),
  currency: z.enum(['USD', 'ARS', 'EUR', 'BRL']).optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Requerido'),
  newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
});

type ProfileData = z.infer<typeof profileSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

export function ProfilePage() {
  const setUser = useAuthStore(s => s.setUser);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();

  const { mutate: doLogout, isPending: loggingOut } = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      logout();
      queryClient.clear();
      navigate('/login');
    },
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: User }>('/users/me');
      return res.data.data;
    },
  });

  const { register: regProfile, handleSubmit: hsProfile, formState: { errors: profErrors } } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    values: { username: profile?.username ?? '', currency: (profile?.currency as 'USD' | 'ARS' | 'EUR' | 'BRL') ?? 'USD', language: profile?.language ?? 'es', timezone: profile?.timezone ?? 'UTC' },
  });

  const { register: regPass, handleSubmit: hsPass, reset: resetPass, formState: { errors: passErrors } } = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) });

  const updateProfile = useMutation({
    mutationFn: async (data: ProfileData) => {
      const res = await api.patch<{ success: boolean; data: User }>('/users/me', data);
      return res.data.data;
    },
    onSuccess: (user) => {
      setUser(user);
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
      toast('success', 'Perfil actualizado');
    },
    onError: () => toast('error', 'Error al actualizar perfil'),
  });

  const changePassword = useMutation({
    mutationFn: async (data: PasswordData) => {
      await api.patch('/users/me/password', data);
    },
    onSuccess: () => { resetPass(); toast('success', 'Contraseña actualizada'); },
    onError: () => toast('error', 'Contraseña actual incorrecta'),
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <PageMeta title="Mi perfil" noindex />
      <div>
        <h1 className="text-xl font-bold text-slate-100">Mi perfil</h1>
        <p className="text-sm text-slate-500 mt-0.5">{profile?.email}</p>
      </div>

      {/* Avatar */}
      <Card className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center text-2xl font-bold text-white">
          {profile?.username?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div>
          <p className="font-semibold text-slate-100">{profile?.username}</p>
          <p className="text-sm text-slate-500">{profile?.email}</p>
        </div>
      </Card>

      {/* Profile form */}
      <Card>
        <CardHeader><CardTitle>Información personal</CardTitle></CardHeader>
        <form onSubmit={hsProfile(d => updateProfile.mutate(d))} className="flex flex-col gap-4">
          <Input label="Usuario" error={profErrors.username?.message} {...regProfile('username')} />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Moneda</label>
              <select className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500" {...regProfile('currency')}>
                {['USD', 'ARS', 'EUR', 'BRL'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Idioma</label>
              <select className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500" {...regProfile('language')}>
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="pt">Português</option>
              </select>
            </div>
          </div>
          <Button type="submit" loading={updateProfile.isPending}>Guardar cambios</Button>
        </form>
      </Card>

      {/* Password form */}
      <Card>
        <CardHeader><CardTitle>Cambiar contraseña</CardTitle></CardHeader>
        <form onSubmit={hsPass(d => changePassword.mutate(d))} className="flex flex-col gap-4">
          <Input label="Contraseña actual" type="password" error={passErrors.currentPassword?.message} {...regPass('currentPassword')} />
          <Input label="Nueva contraseña" type="password" error={passErrors.newPassword?.message} {...regPass('newPassword')} />
          <Button type="submit" loading={changePassword.isPending} variant="secondary">Cambiar contraseña</Button>
        </form>
      </Card>

      {/* Logout */}
      <Card>
        <CardHeader><CardTitle>Sesión</CardTitle></CardHeader>
        <p className="text-sm text-slate-500 mb-4">Cerrá tu sesión en este dispositivo.</p>
        <Button variant="secondary" loading={loggingOut} onClick={() => doLogout()} className="flex items-center gap-2 text-red-400 hover:text-red-300 border-red-900/40 hover:border-red-700">
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </Card>
    </div>
  );
}
