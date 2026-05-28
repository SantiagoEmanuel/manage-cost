import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { CATEGORIES, PAYMENT_METHODS } from '@/shared/lib/format';
import type { Expense } from '@/shared/types';

const schema = z.object({
  description: z.string().min(1, 'Descripción requerida'),
  amount: z.coerce.number().positive('Monto debe ser positivo'),
  category: z.string().min(1),
  paymentMethod: z.string().min(1),
  date: z.string().min(1, 'Fecha requerida'),
  currency: z.string().default('USD'),
  notes: z.string().optional(),
  installments: z.coerce.number().int().min(1).max(60).optional(),
});

export type ExpenseFormData = z.infer<typeof schema>;

interface ExpenseFormProps {
  defaultValues?: Partial<ExpenseFormData>;
  onSubmit: (data: ExpenseFormData) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function ExpenseForm({ defaultValues, onSubmit, isLoading, onCancel }: ExpenseFormProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ExpenseFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      currency: 'USD',
      category: 'general',
      paymentMethod: 'cash',
      date: new Date().toISOString().split('T')[0],
      ...defaultValues,
    },
  });

  const paymentMethod = watch('paymentMethod');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input label="Descripción" placeholder="Supermercado, alquiler..." error={errors.description?.message} {...register('description')} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Monto" type="number" step="0.01" placeholder="0.00" error={errors.amount?.message} {...register('amount')} />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Moneda</label>
          <select className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500" {...register('currency')}>
            {['USD', 'ARS', 'EUR', 'BRL'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Categoría</label>
          <select className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500 capitalize" {...register('category')}>
            {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Método de pago</label>
          <select className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500" {...register('paymentMethod')}>
            {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>
      <Input label="Fecha" type="date" error={errors.date?.message} {...register('date')} />
      {paymentMethod === 'credit' && (
        <Input label="Cuotas" type="number" min="1" max="60" placeholder="1" hint="Dejar en 1 para pago único" {...register('installments')} />
      )}
      <Input label="Notas" placeholder="Notas opcionales..." {...register('notes')} />
      <div className="flex gap-3 pt-2">
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancelar</Button>}
        <Button type="submit" loading={isLoading} className="flex-1">Guardar</Button>
      </div>
    </form>
  );
}

export function expenseToFormData(e: Expense): Partial<ExpenseFormData> {
  return {
    description: e.description, amount: e.amount, currency: e.currency,
    category: e.category, paymentMethod: e.paymentMethod, date: e.date, notes: e.notes ?? '',
  };
}
