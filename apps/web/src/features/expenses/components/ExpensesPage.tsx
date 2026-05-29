import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageMeta } from '@/shared/components/PageMeta';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { expensesApi } from '../api/expenses.api';
import { queryClient } from '@/shared/lib/query-client';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Modal } from '@/shared/components/Modal';
import { EmptyState } from '@/shared/components/EmptyState';
import { ExpenseListSkeleton } from '@/shared/components/SkeletonLoader';
import { toast } from '@/shared/components/Toast';
import { formatCurrency, formatDate, CATEGORIES, PAYMENT_METHODS } from '@/shared/lib/format';
import { ExpenseForm, expenseToFormData, type ExpenseFormData } from './ExpenseForm';
import type { Expense } from '@/shared/types';

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function lastDayOfMonth(year: number, month: number): number {
  if (month === 2) return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
  return [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

function isCreditOverdue(date: string): boolean {
  const [y, m] = date.split('-').map(Number);
  if (!y || !m) return false;
  const dueDay = m === 2 ? 28 : 30;
  return new Date() > new Date(y, m - 1, dueDay, 23, 59, 59);
}

export function ExpensesPage() {
  const now = new Date();
  const [showCreate, setShowCreate] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [filters, setFilters] = useState({ page: 1, category: '', paymentMethod: '' });
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setShowCreate(true);
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const from = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
  const to = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${lastDayOfMonth(selectedYear, selectedMonth)}`;

  function prevMonth() {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
    setFilters(f => ({ ...f, page: 1 }));
  }
  function nextMonth() {
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
    setFilters(f => ({ ...f, page: 1 }));
  }

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', filters, selectedYear, selectedMonth],
    queryFn: () => expensesApi.list({ page: filters.page, category: filters.category || undefined, paymentMethod: filters.paymentMethod || undefined, from, to }),
  });

  const createMutation = useMutation({
    mutationFn: expensesApi.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); setShowCreate(false); toast('success', 'Gasto creado'); },
    onError: () => toast('error', 'Error al crear gasto'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExpenseFormData> }) => expensesApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); setEditingExpense(null); toast('success', 'Gasto actualizado'); },
    onError: () => toast('error', 'Error al actualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: expensesApi.delete,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); toast('success', 'Gasto eliminado'); },
    onError: () => toast('error', 'Error al eliminar'),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageMeta title="Gastos personales" noindex />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Gastos personales</h1>
          <p className="text-sm text-slate-500 mt-0.5">{data?.pagination.total ?? 0} registros</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />Nuevo
        </Button>
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-between bg-slate-900 rounded-xl px-4 py-2.5 border border-slate-800">
        <button onClick={prevMonth} className="text-slate-400 hover:text-slate-100 transition-colors p-1">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-slate-200">
          {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
        </span>
        <button onClick={nextMonth} className="text-slate-400 hover:text-slate-100 transition-colors p-1">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
          value={filters.category}
          onChange={e => setFilters(f => ({ ...f, category: e.target.value, page: 1 }))}
        >
          <option value="">Todas las categorías</option>
          {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
        <select
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
          value={filters.paymentMethod}
          onChange={e => setFilters(f => ({ ...f, paymentMethod: e.target.value, page: 1 }))}
        >
          <option value="">Todos los métodos</option>
          {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      {/* List */}
      {isLoading ? <ExpenseListSkeleton /> : data?.data.length === 0 ? (
        <EmptyState
          icon={<span className="text-4xl">📭</span>}
          title="No hay gastos"
          description={`Sin gastos en ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`}
          action={<Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" />Nuevo gasto</Button>}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {data?.data.map(expense => {
            const creditPastDue = expense.paymentMethod === 'credit' && isCreditOverdue(expense.date);
            return (
              <Card key={expense.id} className={`flex items-center gap-4 hover:border-slate-700 transition-colors ${creditPastDue ? 'border-amber-800/50' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-100 truncate">{expense.description}</p>
                  <p className="text-xs text-slate-500 mt-0.5 capitalize">{expense.category} · {PAYMENT_METHODS.find(m => m.value === expense.paymentMethod)?.label} · {formatDate(expense.date)}</p>
                  {expense.installment && (
                    <p className="text-xs text-violet-400 mt-0.5">
                      Cuota {expense.installment.paidInstallments}/{expense.installment.totalInstallments} — {formatCurrency(expense.installment.installmentAmount, expense.currency)}/mes
                    </p>
                  )}
                  {creditPastDue && (
                    <p className="text-xs text-amber-400 mt-0.5 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Tarjeta vencida — revisá el resumen
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-red-400 shrink-0">{formatCurrency(expense.amount, expense.currency)}</span>
                  <button onClick={() => setEditingExpense(expense)} className="text-slate-600 hover:text-slate-300 transition-colors p-1">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => { if (confirm('¿Eliminar este gasto?')) deleteMutation.mutate(expense.id); }} className="text-slate-600 hover:text-red-400 transition-colors p-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={filters.page === 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>Anterior</Button>
          <span className="text-sm text-slate-500">{filters.page} / {data.pagination.totalPages}</span>
          <Button variant="secondary" size="sm" disabled={filters.page === data.pagination.totalPages} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>Siguiente</Button>
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo gasto">
        <ExpenseForm onSubmit={d => createMutation.mutate(d)} isLoading={createMutation.isPending} onCancel={() => setShowCreate(false)} />
      </Modal>

      <Modal open={editingExpense !== null} onClose={() => setEditingExpense(null)} title="Editar gasto">
        {editingExpense && (
          <ExpenseForm
            defaultValues={expenseToFormData(editingExpense)}
            onSubmit={d => updateMutation.mutate({ id: editingExpense.id, data: d })}
            isLoading={updateMutation.isPending}
            onCancel={() => setEditingExpense(null)}
          />
        )}
      </Modal>
    </div>
  );
}
