import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Plus, UserPlus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { groupsApi } from '../api/groups.api';
import { useAuthStore } from '@/features/auth/auth.store';
import { queryClient } from '@/shared/lib/query-client';
import { Card, CardHeader, CardTitle } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Modal } from '@/shared/components/Modal';
import { Input } from '@/shared/components/Input';
import { PageSpinner } from '@/shared/components/Spinner';
import { toast } from '@/shared/components/Toast';
import { formatCurrency, formatDate, PAYMENT_METHODS, CATEGORIES } from '@/shared/lib/format';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const inviteSchema = z.object({ email: z.string().email('Email inválido') });
const expenseSchema = z.object({
  description: z.string().min(1),
  amount: z.coerce.number().positive(),
  currency: z.string().min(1),
  category: z.string().min(1),
  paymentMethod: z.string().min(1),
  date: z.string().min(1),
  notes: z.string().optional(),
});
type InviteData = z.infer<typeof inviteSchema>;
type ExpenseData = z.infer<typeof expenseSchema>;

export function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const [showInvite, setShowInvite] = useState(false);
  const [showExpense, setShowExpense] = useState(false);

  const { data: group, isLoading } = useQuery({ queryKey: ['groups', id], queryFn: () => groupsApi.getById(id!) });
  const { data: expenses } = useQuery({ queryKey: ['groups', id, 'expenses'], queryFn: () => groupsApi.listExpenses(id!) });
  const { data: balances } = useQuery({ queryKey: ['balances', 'group', id], queryFn: () => groupsApi.getBalances(id!) });

  const { register: regInvite, handleSubmit: hsInvite, reset: resetInvite, formState: { errors: invErrors } } = useForm<InviteData>({ resolver: zodResolver(inviteSchema) });
  const { register: regExp, handleSubmit: hsExp, reset: resetExp, formState: { errors: expErrors } } = useForm<ExpenseData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { currency: 'USD', category: 'general', paymentMethod: 'cash', date: new Date().toISOString().split('T')[0] },
  });

  const inviteMutation = useMutation({
    mutationFn: (data: InviteData) => groupsApi.invite(id!, data.email),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['groups', id] }); setShowInvite(false); resetInvite(); toast('success', 'Usuario agregado al grupo'); },
    onError: (e: { response?: { data?: { message?: string } } }) => toast('error', e.response?.data?.message ?? 'Error al invitar'),
  });

  const expenseMutation = useMutation({
    mutationFn: (data: ExpenseData) => groupsApi.createExpense(id!, { ...data, splitType: 'equal' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['groups', id, 'expenses'] }); queryClient.invalidateQueries({ queryKey: ['balances'] }); setShowExpense(false); resetExp(); toast('success', 'Gasto grupal creado'); },
    onError: () => toast('error', 'Error al crear gasto'),
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => groupsApi.removeMember(id!, userId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['groups', id] }); toast('success', 'Miembro eliminado'); },
    onError: () => toast('error', 'Error al eliminar miembro'),
  });

  if (isLoading) return <PageSpinner />;
  if (!group) return null;

  const isOwner = group.ownerId === user?.id;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/groups')} className="text-slate-500 hover:text-slate-200 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-100">{group.name}</h1>
          {group.description && <p className="text-sm text-slate-500">{group.description}</p>}
        </div>
        <Button size="sm" onClick={() => setShowExpense(true)}><Plus className="h-4 w-4" />Gasto</Button>
      </div>

      {/* Balances */}
      {(balances?.iOwe?.length ?? 0) + (balances?.theyOweMe?.length ?? 0) > 0 && (
        <div className="grid md:grid-cols-2 gap-3">
          {(balances?.iOwe ?? []).map(d => (
            <Card key={d.debtId} className="flex items-center gap-3 border-red-900/30">
              <TrendingDown className="h-5 w-5 text-red-400 shrink-0" />
              <div className="flex-1 text-sm text-slate-400">Le debés a <span className="text-slate-200">{d.creditorUsername}</span></div>
              <span className="font-semibold text-red-400">{formatCurrency(d.amount, d.currency)}</span>
            </Card>
          ))}
          {(balances?.theyOweMe ?? []).map(d => (
            <Card key={d.debtId} className="flex items-center gap-3 border-green-900/30">
              <TrendingUp className="h-5 w-5 text-green-400 shrink-0" />
              <div className="flex-1 text-sm text-slate-400"><span className="text-slate-200">{d.debtorUsername}</span> te debe</div>
              <span className="font-semibold text-green-400">{formatCurrency(d.amount, d.currency)}</span>
            </Card>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Members */}
        <Card>
          <CardHeader>
            <CardTitle>Miembros ({group.members?.length ?? 0})</CardTitle>
            <button onClick={() => setShowInvite(true)} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              <UserPlus className="h-3 w-3" />Invitar
            </button>
          </CardHeader>
          <div className="flex flex-col gap-2">
            {group.members?.map(m => (
              <div key={m.id} className="flex items-center gap-2 py-1">
                <div className="w-7 h-7 rounded-full bg-violet-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {m.username[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{m.username}</p>
                  <p className="text-xs text-slate-600 capitalize">{m.role}</p>
                </div>
                {isOwner && m.userId !== user?.id && (
                  <button onClick={() => { if (confirm('¿Eliminar miembro?')) removeMember.mutate(m.userId); }} className="text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Gastos grupales</CardTitle>
          </CardHeader>
          {expenses?.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Sin gastos aún</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
              {expenses?.map(e => (
                <div key={e.id} className="border-b border-slate-800 pb-2 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-slate-200">{e.description}</p>
                      <p className="text-xs text-slate-500">Pagó {e.payerUsername} · {formatDate(e.date)}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-200">{formatCurrency(e.amount, e.currency)}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {e.splits.map(s => (
                      <span key={s.userId} className="text-[10px] bg-slate-800 text-slate-400 rounded px-1.5 py-0.5">
                        {s.username}: {formatCurrency(s.amount, e.currency)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Invite modal */}
      <Modal open={showInvite} onClose={() => { setShowInvite(false); resetInvite(); }} title="Invitar usuario">
        <form onSubmit={hsInvite(d => inviteMutation.mutate(d))} className="flex flex-col gap-4">
          <Input label="Email del usuario" type="email" placeholder="usuario@email.com" error={invErrors.email?.message} {...regInvite('email')} />
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => { setShowInvite(false); resetInvite(); }} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={inviteMutation.isPending} className="flex-1">Agregar</Button>
          </div>
        </form>
      </Modal>

      {/* Create group expense modal */}
      <Modal open={showExpense} onClose={() => { setShowExpense(false); resetExp(); }} title="Nuevo gasto grupal">
        <form onSubmit={hsExp(d => expenseMutation.mutate(d))} className="flex flex-col gap-4">
          <Input label="Descripción" placeholder="Cena, compras..." error={expErrors.description?.message} {...regExp('description')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Monto" type="number" step="0.01" error={expErrors.amount?.message} {...regExp('amount')} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Moneda</label>
              <select className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500" {...regExp('currency')}>
                {['USD', 'ARS', 'EUR', 'BRL'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Categoría</label>
              <select className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500" {...regExp('category')}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Método</label>
              <select className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500" {...regExp('paymentMethod')}>
                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>
          <Input label="Fecha" type="date" {...regExp('date')} />
          <p className="text-xs text-slate-500">El gasto se dividirá equitativamente entre todos los miembros.</p>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => { setShowExpense(false); resetExp(); }} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={expenseMutation.isPending} className="flex-1">Crear</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
