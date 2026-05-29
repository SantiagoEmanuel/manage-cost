import { useState } from 'react';
import { PageMeta } from '@/shared/components/PageMeta';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftRight, Plus } from 'lucide-react';
import { settlementsApi } from '../api/settlements.api';
import { PaymentModal } from './PaymentModal';
import { Card, CardHeader, CardTitle } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { EmptyState } from '@/shared/components/EmptyState';
import { CardSkeleton } from '@/shared/components/SkeletonLoader';
import { formatCurrency, formatDateTime, paymentMethodLabel } from '@/shared/lib/format';
import type { Settlement } from '@/shared/types';

export function SettlementsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [preselectedDebtId, setPreselectedDebtId] = useState<string | undefined>(undefined);
  const { data: balances, isLoading: balLoading } = useQuery({ queryKey: ['balances'], queryFn: settlementsApi.getBalances });
  const { data: settlements, isLoading: settLoading } = useQuery({ queryKey: ['settlements'], queryFn: () => settlementsApi.list() });

  const iOwe = balances?.iOwe ?? [];

  const openPay = (debtId?: string) => { setPreselectedDebtId(debtId); setShowCreate(true); };

  return (
    <div className="flex flex-col gap-6">
      <PageMeta title="Liquidaciones" noindex />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Liquidaciones</h1>
          <p className="text-sm text-slate-500 mt-0.5">Pagos y deudas pendientes</p>
        </div>
        {iOwe.length > 0 && (
          <Button size="sm" onClick={() => openPay()}><Plus className="h-4 w-4" />Pagar deuda</Button>
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
                  <Button size="sm" variant="secondary" onClick={() => openPay(d.debtId)}>
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
          <div className="flex flex-col gap-3">
            {settlements.map((s: Settlement) => (
              <div key={s.id} className="flex items-start justify-between gap-3 py-2 border-b border-slate-800 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm text-slate-200">
                    Pago a <span className="font-medium">{s.debt?.creditorUsername ?? '—'}</span>
                    {s.debt?.groupName ? <span className="text-slate-500"> · {s.debt.groupName}</span> : null}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDateTime(s.paidAt)} · {paymentMethodLabel(s.paymentMethod)}
                    {s.debt?.status === 'paid' ? ' · Saldada' : s.debt?.status === 'partial' ? ' · Pago parcial' : ''}
                  </p>
                  {s.reference && <p className="text-xs text-slate-600 truncate">Ref: {s.reference}</p>}
                  {s.notes && <p className="text-xs text-slate-600 truncate">{s.notes}</p>}
                </div>
                <span className="text-sm font-medium text-green-400 shrink-0">{formatCurrency(s.amount, s.debt?.currency ?? 'USD')}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <PaymentModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        debts={iOwe}
        preselectedDebtId={preselectedDebtId}
      />
    </div>
  );
}
