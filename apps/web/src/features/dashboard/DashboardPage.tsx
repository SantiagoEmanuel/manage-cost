import { useQuery } from '@tanstack/react-query';
import { PageMeta } from '@/shared/components/PageMeta';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, CreditCard, Users, Plus } from 'lucide-react';
import { useAuthStore } from '@/features/auth/auth.store';
import { expensesApi } from '@/features/expenses/api/expenses.api';
import { settlementsApi } from '@/features/settlements/api/settlements.api';
import { Card, CardHeader, CardTitle } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { CardSkeleton } from '@/shared/components/SkeletonLoader';
import { formatCurrency, formatDate } from '@/shared/lib/format';

function StatCard({ label, value, sub, icon, color }: { label: string; value: string; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <Card className="flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-100 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const user = useAuthStore(s => s.user);

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

  return (
    <div className="flex flex-col gap-6">
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statsLoading || balLoading ? (
          <>
            <CardSkeleton lines={1} />
            <CardSkeleton lines={1} />
            <CardSkeleton lines={1} />
            <CardSkeleton lines={1} />
          </>
        ) : (
          <>
            <StatCard label="Gastos del mes" value={formatCurrency(stats?.totalMonth ?? 0, user?.currency)} icon={<TrendingDown className="h-5 w-5 text-red-400" />} color="bg-red-500/10" />
            <StatCard label="Gastos del año" value={formatCurrency(stats?.totalYear ?? 0, user?.currency)} icon={<CreditCard className="h-5 w-5 text-blue-400" />} color="bg-blue-500/10" />
            <StatCard label="Me deben" value={formatCurrency(balances?.totalOwedToMe ?? 0, user?.currency)} icon={<TrendingUp className="h-5 w-5 text-green-400" />} color="bg-green-500/10" />
            <StatCard label="Debo" value={formatCurrency(balances?.totalIOwe ?? 0, user?.currency)} icon={<Users className="h-5 w-5 text-yellow-400" />} color="bg-yellow-500/10" />
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
              <div className="flex flex-col gap-2">
                {expenses?.data.map(e => (
                  <div key={e.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                    <div>
                      <p className="text-sm text-slate-200">{e.description}</p>
                      <p className="text-xs text-slate-500">{e.category} · {formatDate(e.date)}</p>
                    </div>
                    <span className="text-sm font-medium text-red-400">-{formatCurrency(e.amount, e.currency)}</span>
                  </div>
                ))}
              </div>
            )
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Por categoría</CardTitle>
          </CardHeader>
          {statsLoading ? <CardSkeleton lines={4} /> : (
            stats?.byCategory.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">Sin datos</p>
            ) : (
              <div className="flex flex-col gap-3">
                {stats?.byCategory.slice(0, 6).map(c => (
                  <div key={c.category}>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span className="capitalize">{c.category}</span>
                      <span>{formatCurrency(c.total, user?.currency)}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div
                        className="bg-violet-500 h-1.5 rounded-full"
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

      {/* Balances */}
      {(balances?.iOwe.length ?? 0) + (balances?.theyOweMe.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Deudas pendientes</CardTitle>
            <Link to="/settlements" className="text-xs text-violet-400 hover:text-violet-300">Ver todas</Link>
          </CardHeader>
          <div className="flex flex-col gap-2">
            {balances?.iOwe.slice(0, 3).map(d => (
              <div key={d.debtId} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                <p className="text-sm text-slate-400">Le debés a <span className="text-slate-200">{d.creditorUsername}</span> ({d.groupName})</p>
                <span className="text-sm font-medium text-red-400">{formatCurrency(d.amount, d.currency)}</span>
              </div>
            ))}
            {balances?.theyOweMe.slice(0, 3).map(d => (
              <div key={d.debtId} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                <p className="text-sm text-slate-400"><span className="text-slate-200">{d.debtorUsername}</span> te debe ({d.groupName})</p>
                <span className="text-sm font-medium text-green-400">{formatCurrency(d.amount, d.currency)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
