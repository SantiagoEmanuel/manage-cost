import { useQuery } from '@tanstack/react-query';
import { PageMeta } from '@/shared/components/PageMeta';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, CreditCard, Users, Plus, Wallet, Target, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/features/auth/auth.store';
import { expensesApi } from '@/features/expenses/api/expenses.api';
import { settlementsApi } from '@/features/settlements/api/settlements.api';
import { fixedExpensesApi } from '@/features/budget/api/fixed-expenses.api';
import { api } from '@/shared/lib/api';
import { Card, CardHeader, CardTitle } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { CardSkeleton } from '@/shared/components/SkeletonLoader';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import type { User } from '@/shared/types';

const CATEGORY_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-cyan-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-rose-500', 'bg-indigo-500', 'bg-pink-500',
];

function StatCard({ label, value, sub, icon, color }: { label: string; value: string; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <Card className="flex items-start gap-3 overflow-hidden">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500 truncate">{label}</p>
        <p className="text-base font-bold text-slate-100 mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5 truncate">{sub}</p>}
      </div>
    </Card>
  );
}

function BudgetBar({ label, amount, total, color, currency }: { label: string; amount: number; total: number; color: string; currency?: string }) {
  const pct = total > 0 ? Math.min(100, (amount / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300 font-medium">{formatCurrency(amount, currency)} <span className="text-slate-600">({pct.toFixed(0)}%)</span></span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function DashboardPage() {
  const user = useAuthStore(s => s.user);

  const { data: profile } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: User }>('/users/me');
      return res.data.data;
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['expenses', 'stats'],
    queryFn: expensesApi.getStats,
  });

  const { data: expenses, isLoading: expLoading } = useQuery({
    queryKey: ['expenses', { page: 1, limit: 5 }],
    queryFn: () => expensesApi.list({ page: 1, limit: 5 }),
  });

  const { data: balances, isLoading: balLoading } = useQuery({
    queryKey: ['balances'],
    queryFn: settlementsApi.getBalances,
  });

  const { data: fixedExpenses } = useQuery({
    queryKey: ['fixed-expenses'],
    queryFn: fixedExpensesApi.list,
  });

  const salary = profile?.monthlyIncome ?? 0;
  const activeFixed = (fixedExpenses ?? []).filter(f => f.isActive);
  const totalFixed = activeFixed.reduce((s, f) => s + f.amount, 0);
  const totalVariable = stats?.totalMonth ?? 0;
  const totalSpent = totalFixed + totalVariable;
  const remaining = salary - totalSpent;
  const hasSalary = salary > 0;

  return (
    <div className="flex flex-col gap-5">
      <PageMeta title="Dashboard" noindex />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Hola, {user?.username} 👋</h1>
          <p className="text-sm text-slate-500 mt-0.5">Resumen financiero</p>
        </div>
        <Link to="/expenses?new=1">
          <Button size="sm"><Plus className="h-4 w-4" />Nuevo gasto</Button>
        </Link>
      </div>

      {/* Budget widget (only when salary is set) */}
      {hasSalary && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">Presupuesto mensual</p>
                <p className="text-xs text-slate-500">Sueldo: {formatCurrency(salary, profile?.currency)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${remaining >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(Math.abs(remaining), profile?.currency)}
              </p>
              <p className="text-xs text-slate-500">{remaining >= 0 ? 'disponible' : 'en exceso'}</p>
            </div>
          </div>

          {/* Overall progress */}
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500">Gastado</span>
              <span className="text-slate-400">{salary > 0 ? `${Math.min(100, (totalSpent / salary) * 100).toFixed(0)}%` : '—'}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
              {/* Fixed portion */}
              <div className="h-3 flex">
                <div
                  className="bg-amber-500 h-full transition-all"
                  style={{ width: `${salary > 0 ? Math.min(100, (totalFixed / salary) * 100) : 0}%` }}
                />
                <div
                  className="bg-red-500 h-full transition-all"
                  style={{ width: `${salary > 0 ? Math.min(100 - (totalFixed / salary) * 100, (totalVariable / salary) * 100) : 0}%` }}
                />
              </div>
            </div>
            <div className="flex gap-4 mt-2">
              <span className="flex items-center gap-1 text-[11px] text-slate-500"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />Fijos</span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Variables</span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500"><span className="w-2 h-2 rounded-full bg-slate-700 inline-block" />Disponible</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <BudgetBar label="Gastos fijos" amount={totalFixed} total={salary} color="bg-amber-500" currency={profile?.currency} />
            <BudgetBar label="Gastos variables" amount={totalVariable} total={salary} color="bg-red-500" currency={profile?.currency} />
          </div>

          <Link to="/profile" className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 mt-3">
            <Target className="h-3 w-3" />Gestionar presupuesto
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Card>
      )}

      {!hasSalary && (
        <Card className="border-dashed border-slate-700 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
              <Wallet className="h-4 w-4 text-violet-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-300">Configurá tu presupuesto</p>
              <p className="text-xs text-slate-500 mt-0.5">Ingresá tu sueldo para ver cuánto te queda cada mes</p>
            </div>
            <Link to="/profile">
              <Button size="sm" variant="secondary">Configurar</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statsLoading || balLoading ? (
          <><CardSkeleton lines={1} /><CardSkeleton lines={1} /><CardSkeleton lines={1} /><CardSkeleton lines={1} /></>
        ) : (
          <>
            <StatCard
              label="Gastos del mes"
              value={formatCurrency(stats?.totalMonth ?? 0, user?.currency)}
              icon={<TrendingDown className="h-4 w-4 text-red-400" />}
              color="bg-red-500/10"
            />
            <StatCard
              label="Gastos del año"
              value={formatCurrency(stats?.totalYear ?? 0, user?.currency)}
              icon={<CreditCard className="h-4 w-4 text-blue-400" />}
              color="bg-blue-500/10"
            />
            <StatCard
              label="Me deben"
              value={formatCurrency(balances?.totalOwedToMe ?? 0, user?.currency)}
              icon={<TrendingUp className="h-4 w-4 text-green-400" />}
              color="bg-green-500/10"
            />
            <StatCard
              label="Debo"
              value={formatCurrency(balances?.totalIOwe ?? 0, user?.currency)}
              icon={<Users className="h-4 w-4 text-yellow-400" />}
              color="bg-yellow-500/10"
            />
          </>
        )}
      </div>

      {/* Recent expenses + category breakdown */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Últimos gastos</CardTitle>
            <Link to="/expenses" className="text-xs text-violet-400 hover:text-violet-300">Ver todos</Link>
          </CardHeader>
          {expLoading ? <CardSkeleton lines={4} /> : (
            expenses?.data.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No hay gastos aún</p>
            ) : (
              <div className="flex flex-col divide-y divide-slate-800">
                {expenses?.data.map(e => (
                  <div key={e.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                      <span className="text-xs">{categoryEmoji(e.category)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate">{e.description}</p>
                      <p className="text-xs text-slate-600">{e.category} · {formatDate(e.date)}</p>
                    </div>
                    <span className="text-sm font-medium text-red-400 shrink-0">-{formatCurrency(e.amount, e.currency)}</span>
                  </div>
                ))}
              </div>
            )
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Por categoría</CardTitle>
            <span className="text-xs text-slate-600">Este mes</span>
          </CardHeader>
          {statsLoading ? <CardSkeleton lines={4} /> : (
            stats?.byCategory.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">Sin datos</p>
            ) : (
              <div className="flex flex-col gap-3">
                {stats?.byCategory.slice(0, 6).map((c, i) => (
                  <div key={c.category}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400 capitalize flex items-center gap-1.5">
                        <span>{categoryEmoji(c.category)}</span>{c.category}
                      </span>
                      <span className="text-slate-300 font-medium">{formatCurrency(c.total, user?.currency)}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div
                        className={`${CATEGORY_COLORS[i % CATEGORY_COLORS.length]} h-1.5 rounded-full`}
                        style={{ width: `${Math.min(100, (c.total / (stats.totalMonth || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </Card>
      </div>

      {/* Pending debts */}
      {(balances?.iOwe.length ?? 0) + (balances?.theyOweMe.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Deudas pendientes</CardTitle>
            <Link to="/settlements" className="text-xs text-violet-400 hover:text-violet-300">Ver todas</Link>
          </CardHeader>
          <div className="flex flex-col divide-y divide-slate-800">
            {balances?.iOwe.slice(0, 3).map(d => (
              <div key={d.debtId} className="flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                <p className="text-sm text-slate-400 min-w-0 truncate">Le debés a <span className="text-slate-200">{d.creditorUsername}</span> <span className="text-slate-600">({d.groupName})</span></p>
                <span className="text-sm font-medium text-red-400 shrink-0">{formatCurrency(d.amount, d.currency)}</span>
              </div>
            ))}
            {balances?.theyOweMe.slice(0, 3).map(d => (
              <div key={d.debtId} className="flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                <p className="text-sm text-slate-400 min-w-0 truncate"><span className="text-slate-200">{d.debtorUsername}</span> te debe <span className="text-slate-600">({d.groupName})</span></p>
                <span className="text-sm font-medium text-green-400 shrink-0">{formatCurrency(d.amount, d.currency)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function categoryEmoji(cat: string): string {
  const map: Record<string, string> = {
    comida: '🍔', restaurante: '🍽️', transporte: '🚗', entretenimiento: '🎬',
    salud: '💊', ropa: '👕', hogar: '🏠', tecnología: '💻', educación: '📚',
    viajes: '✈️', deportes: '⚽', mascotas: '🐾', servicios: '💡', suscripciones: '📱',
    general: '📦',
  };
  return map[cat.toLowerCase()] ?? '💸';
}
