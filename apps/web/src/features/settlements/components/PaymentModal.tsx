import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { settlementsApi } from '../api/settlements.api';
import { queryClient } from '@/shared/lib/query-client';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Modal } from '@/shared/components/Modal';
import { toast } from '@/shared/components/Toast';
import { formatCurrency, PAYMENT_METHODS } from '@/shared/lib/format';
import type { Debt, PaymentMethod } from '@/shared/types';

const schema = z.object({
  debtId: z.string().uuid('Seleccioná una deuda'),
  amount: z.coerce.number().positive('Ingresá un monto válido'),
  paymentMethod: z.enum(['cash', 'debit', 'credit', 'transfer', 'digital_wallet']),
  paidAt: z.string().min(1, 'Indicá la fecha del pago'),
  reference: z.string().optional(),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  /** Deudas que el usuario puede pagar (donde es deudor). */
  debts: Debt[];
  /** Deuda preseleccionada al abrir. */
  preselectedDebtId?: string;
}

const today = () => new Date().toISOString().split('T')[0] as string;

export function PaymentModal({ open, onClose, debts, preselectedDebtId }: PaymentModalProps) {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: 'transfer', paidAt: today() },
  });

  const selectedId = watch('debtId');
  const selectedDebt = debts.find(d => d.debtId === selectedId);

  // Preseleccionar deuda y monto al abrir.
  useEffect(() => {
    if (!open) return;
    const target = preselectedDebtId ?? debts[0]?.debtId ?? '';
    const debt = debts.find(d => d.debtId === target);
    reset({
      debtId: target,
      amount: debt?.amount ?? 0,
      paymentMethod: 'transfer',
      paidAt: today(),
      reference: '',
      notes: '',
    });
  }, [open, preselectedDebtId, debts, reset]);

  const mutation = useMutation({
    mutationFn: settlementsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      onClose();
      toast('success', 'Pago registrado y deuda actualizada');
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast('error', e.response?.data?.message ?? 'Error al registrar el pago'),
  });

  return (
    <Modal open={open} onClose={onClose} title="Registrar pago">
      <form
        onSubmit={handleSubmit(d => mutation.mutate({
          debtId: d.debtId,
          amount: d.amount,
          paymentMethod: d.paymentMethod as PaymentMethod,
          paidAt: d.paidAt,
          reference: d.reference || null,
          notes: d.notes || null,
        }))}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Deuda a saldar</label>
          <select
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
            {...register('debtId')}
          >
            <option value="">Seleccioná una deuda</option>
            {debts.map(d => (
              <option key={d.debtId} value={d.debtId}>
                {d.creditorUsername} — {formatCurrency(d.amount, d.currency)}{d.groupName ? ` (${d.groupName})` : ''}
              </option>
            ))}
          </select>
          {errors.debtId && <p className="text-xs text-red-400">{errors.debtId.message}</p>}
          {selectedDebt && (
            <button
              type="button"
              onClick={() => setValue('amount', selectedDebt.amount)}
              className="self-start text-xs text-violet-400 hover:text-violet-300"
            >
              Pagar el total: {formatCurrency(selectedDebt.amount, selectedDebt.currency)}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Monto a pagar" type="number" step="0.01" error={errors.amount?.message} {...register('amount')} />
          <Input label="Fecha del pago" type="date" error={errors.paidAt?.message} {...register('paidAt')} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Medio de pago</label>
          <select
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
            {...register('paymentMethod')}
          >
            {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        <Input
          label="Referencia / comprobante (opcional)"
          placeholder="N° de operación, CBU, alias..."
          hint="Para ubicar la transacción más tarde"
          {...register('reference')}
        />
        <Input label="Notas (opcional)" placeholder="Detalle del pago..." {...register('notes')} />

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={mutation.isPending} className="flex-1" disabled={debts.length === 0}>
            Registrar pago
          </Button>
        </div>
      </form>
    </Modal>
  );
}
