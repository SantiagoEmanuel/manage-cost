import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PageMeta } from '@/shared/components/PageMeta';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { LogOut, Plus, Trash2, ToggleLeft, ToggleRight, Wallet } from 'lucide-react';
import { api } from '@/shared/lib/api';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/features/auth/auth.store';
import { fixedExpensesApi } from '@/features/budget/api/fixed-expenses.api';
import { queryClient } from '@/shared/lib/query-client';
import { Card, CardHeader, CardTitle } from '@/shared/components/Card';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { Modal } from '@/shared/components/Modal';
import { PageSpinner } from '@/shared/components/Spinner';
import { toast } from '@/shared/components/Toast';
import { formatCurrency, CATEGORIES } from '@/shared/lib/format';
import type { User } from '@/shared/types';

const profileSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional().or(z.literal('')),
  currency: z.enum(['USD', 'ARS', 'EUR', 'BRL']).optional(),
  language: z.string().optional(),
  monthlyIncome: z.coerce.number().min(0).optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Requerido'),
  newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
});

const fixedExpenseSchema = z.object({
  description: z.string().min(1, 'Requerido'),
  amount: z.coerce.number().positive('Monto inválido'),
  currency: z.string().min(1),
  category: z.string().min(1),
});

type ProfileData = z.infer<typeof profileSchema>;
type PasswordData = z.infer<typeof passwordSchema>;
type FixedExpenseData = z.infer<typeof fixedExpenseSchema>;

export function ProfilePage() {
  const setUser = useAuthStore(s => s.setUser);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const [showAddFixed, setShowAddFixed] = useState(false);

  const { mutate: doLogout, isPending: loggingOut } = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => { logout(); queryClient.clear(); navigate('/login'); },
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: User }>('/users/me');
      return res.data.data;
    },
  });

  const { data: fixedExpenses } = useQuery({
    queryKey: ['fixed-expenses'],
    queryFn: fixedExpensesApi.list,
  });

  const { register: regProfile, handleSubmit: hsProfile, formState: { errors: profErrors } } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    values: {
      username: profile?.username ?? '',
      currency: (profile?.currency as 'USD' | 'ARS' | 'EUR' | 'BRL') ?? 'USD',
      language: profile?.language ?? 'es',
      monthlyIncome: profile?.monthlyIncome ?? 0,
    },
  });

  const { register: regPass, handleSubmit: hsPass, reset: resetPass, formState: { errors: passErrors } } = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) });

  const { register: regFixed, handleSubmit: hsFixed, reset: resetFixed, formState: { errors: fixedErrors } } = useForm<FixedExpenseData>({
    resolver: zodResolver(fixedExpenseSchema),
    defaultValues: { currency: profile?.currency ?? 'USD', category: 'general' },
  });

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
    mutationFn: async (data: PasswordData) => { await api.patch('/users/me/password', data); },
    onSuccess: () => { resetPass(); toast('success', 'Contraseña actualizada'); },
    onError: () => toast('error', 'Contraseña actual incorrecta'),
  });

  const createFixed = useMutation({
    mutationFn: fixedExpensesApi.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['fixed-expenses'] }); setShowAddFixed(false); resetFixed(); toast('success', 'Gasto fijo agregado'); },
    onError: () => toast('error', 'Error al agregar'),
  });

  const toggleFixed = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => fixedExpensesApi.update(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fixed-expenses'] }),
  });

  const deleteFixed = useMutation({
    mutationFn: fixedExpensesApi.delete,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['fixed-expenses'] }); toast('success', 'Gasto fijo eliminado'); },
    onError: () => toast('error', 'Error al eliminar'),
  });

  if (isLoading) return <PageSpinner />;

  const activeFixed = (fixedExpenses ?? []).filter(f => f.isActive);
  const totalFixed = activeFixed.reduce((s, f) => s + f.amount, 0);
  const salary = profile?.monthlyIncome ?? 0;

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

      {/* Profile + salary form */}
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
          <Input
            label="Sueldo mensual"
            type="number"
            step="0.01"
            placeholder="0"
            error={profErrors.monthlyIncome?.message}
            {...regProfile('monthlyIncome')}
          />
          <Button type="submit" loading={updateProfile.isPending}>Guardar cambios</Button>
        </form>
      </Card>

      {/* Fixed expenses */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-violet-400" />
            <CardTitle>Gastos fijos</CardTitle>
          </div>
          <button onClick={() => setShowAddFixed(true)} className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300">
            <Plus className="h-3.5 w-3.5" />Agregar
          </button>
        </CardHeader>

        {salary > 0 && (
          <div className="flex items-center justify-between mb-4 px-3 py-2 bg-slate-800/50 rounded-lg">
            <span className="text-xs text-slate-400">Total fijos / Sueldo</span>
            <span className="text-xs font-semibold text-slate-200">
              {formatCurrency(totalFixed, profile?.currency)} / {formatCurrency(salary, profile?.currency)}
              <span className="text-slate-500 ml-1">({salary > 0 ? ((totalFixed / salary) * 100).toFixed(0) : 0}%)</span>
            </span>
          </div>
        )}

        {!fixedExpenses || fixedExpenses.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">Sin gastos fijos registrados</p>
        ) : (
          <div className="flex flex-col gap-2">
            {fixedExpenses.map(fe => (
              <div key={fe.id} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${fe.isActive ? 'border-slate-700 bg-slate-800/30' : 'border-slate-800 bg-slate-900 opacity-50'}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{fe.description}</p>
                  <p className="text-xs text-slate-500 capitalize">{fe.category}</p>
                </div>
                <span className="text-sm font-medium text-amber-400 shrink-0">{formatCurrency(fe.amount, fe.currency)}</span>
                <button
                  onClick={() => toggleFixed.mutate({ id: fe.id, isActive: !fe.isActive })}
                  className={`shrink-0 transition-colors ${fe.isActive ? 'text-violet-400 hover:text-violet-300' : 'text-slate-600 hover:text-slate-400'}`}
                >
                  {fe.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => { if (confirm('¿Eliminar este gasto fijo?')) deleteFixed.mutate(fe.id); }}
                  className="text-slate-600 hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
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

      {/* Add fixed expense modal */}
      <Modal open={showAddFixed} onClose={() => { setShowAddFixed(false); resetFixed(); }} title="Nuevo gasto fijo">
        <form onSubmit={hsFixed(d => createFixed.mutate(d))} className="flex flex-col gap-4">
          <Input label="Descripción" placeholder="Alquiler, Netflix, gym..." error={fixedErrors.description?.message} {...regFixed('description')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Monto" type="number" step="0.01" error={fixedErrors.amount?.message} {...regFixed('amount')} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Moneda</label>
              <select className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500" {...regFixed('currency')}>
                {['USD', 'ARS', 'EUR', 'BRL'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Categoría</label>
            <select className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500" {...regFixed('category')}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => { setShowAddFixed(false); resetFixed(); }} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={createFixed.isPending} className="flex-1">Agregar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
