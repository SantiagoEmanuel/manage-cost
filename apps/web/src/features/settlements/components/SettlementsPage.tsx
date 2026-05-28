import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeftRight, Plus } from 'lucide-react';
import { settlementsApi } from '../api/settlements.api';
import { queryClient } from '@/shared/lib/query-client';
import { Card, CardHeader, CardTitle } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Modal } from '@/shared/components/Modal';
import { EmptyState } from '@/shared/components/EmptyState';
import { CardSkeleton } from '@/shared/components/SkeletonLoader';
import { toast } from '@/shared/components/Toast';
import { formatCurrency } from '@/shared/lib/format';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  debtId: z.string().uuid('Seleccioná una deuda'),
  amount: z.coerce.number().positive('Monto positivo'),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function SettlementsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { data: balances, isLoading: balLoading } = useQuery({ queryKey: ['balances'], queryFn: settlementsApi.getBalances });
  const { data: settlements, isLoading: settLoading } = useQuery({ queryKey: ['settlements'], queryFn: settlementsApi.list });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: settlementsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      setShowCreate(false); reset();
      toast('success', 'Pago registrado');
    },
    onError: () => toast('error', 'Error al registrar pago'),
  });

  const iOwe = balances?.iOwe ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Liquidaciones</h1>
          <p className="text-sm text-slate-500 mt-0.5">Pagos y deudas pendientes</p>
        </div>
        {iOwe.length > 0 && (
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" />Pagar deuda</Button>
        )}
      </div>

      {/* What I owe */}
      <Card>
        <CardHeader>
          <CardTitle>Lo que debo</CardTitle>
        </CardHeader>
        {balLoading ? <CardSkeleton lines={3} /> : iOwe.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">No tenés deudas pendientes 🎉</p>
        ) : (
          <div className="flex flex-col gap-2">
            {iOwe.map(d => (
              <div key={d.debtId} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                <div>
                  <p className="text-sm text-slate-200">Le debés a <span className="font-medium">{d.creditorUsername}</span></p>
                  <p className="text-xs text-slate-500">{d.groupName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-red-400">{formatCurrency(d.amount, d.currency)}</span>
                  <Button size="sm" variant="secondary" onClick={() => { setValue('debtId', d.debtId); setValue('amount', d.amount); setShowCreate(true); }}>
                    Pagar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* What they owe me */}
      <Card>
        <CardHeader>
          <CardTitle>Lo que me deben</CardTitle>
        </CardHeader>
        {balLoading ? <CardSkeleton lines={3} /> : (balances?.theyOweMe ?? []).length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">Nadie te debe dinero</p>
        ) : (
          <div className="flex flex-col gap-2">
            {(balances?.theyOweMe ?? []).map(d => (
              <div key={d.debtId} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                <div>
                  <p className="text-sm text-slate-200"><span className="font-medium">{d.debtorUsername}</span> te debe</p>
                  <p className="text-xs text-slate-500">{d.groupName}</p>
                </div>
                <span className="text-sm font-semibold text-green-400">{formatCurrency(d.amount, d.currency)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de pagos</CardTitle>
        </CardHeader>
        {settLoading ? <CardSkeleton lines={4} /> : !settlements || settlements.length === 0 ? (
          <EmptyState icon={<ArrowLeftRight className="h-10 w-10" />} title="Sin pagos registrados" description="Cuando liquidés deudas aparecerán aquí" />
        ) : (
          <div className="flex flex-col gap-2">
            {settlements.map((s: { id: string; amount: number; createdAt: string; notes?: string | null; debt?: { currency: string } }) => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                <div>
                  <p className="text-sm text-slate-200">Pago realizado</p>
                  <p className="text-xs text-slate-500">{new Date(s.createdAt).toLocaleDateString('es-AR')}</p>
                  {s.notes && <p className="text-xs text-slate-600">{s.notes}</p>}
                </div>
                <span className="text-sm font-medium text-green-400">{formatCurrency(s.amount, s.debt?.currency ?? 'USD')}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Pay modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); reset(); }} title="Registrar pago">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Deuda</label>
            <select className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500" {...register('debtId')}>
              <option value="">Seleccioná una deuda</option>
              {iOwe.map(d => (
                <option key={d.debtId} value={d.debtId}>
                  {d.creditorUsername} — {formatCurrency(d.amount, d.currency)} ({d.groupName})
                </option>
              ))}
            </select>
            {errors.debtId && <p className="text-xs text-red-400">{errors.debtId.message}</p>}
          </div>
          <Input label="Monto a pagar" type="number" step="0.01" error={errors.amount?.message} {...register('amount')} />
          <Input label="Notas (opcional)" placeholder="Transferencia..." {...register('notes')} />
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => { setShowCreate(false); reset(); }} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={createMutation.isPending} className="flex-1">Registrar pago</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
