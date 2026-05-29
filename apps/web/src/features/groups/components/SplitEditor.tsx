import { formatCurrency } from '@/shared/lib/format';
import type { GroupMember } from '@/shared/types';

export type SplitType = 'equal' | 'percentage' | 'amount';

export interface Split {
  userId: string;
  value: number;
}

interface SplitEditorProps {
  members: GroupMember[];
  totalAmount: number;
  splitType: SplitType;
  onSplitTypeChange: (type: SplitType) => void;
  splits: Split[];
  onSplitsChange: (splits: Split[]) => void;
  currency?: string;
}

/** Valida los splits según el tipo. Devuelve un mensaje de error o null si son válidos. */
export function validateSplits(type: SplitType, splits: Split[], total: number): string | null {
  if (type === 'equal') return null;
  const sum = splits.reduce((s, x) => s + (Number(x.value) || 0), 0);
  if (type === 'percentage') {
    if (Math.abs(sum - 100) > 0.01) return `Los porcentajes deben sumar 100% (suman ${sum.toFixed(2)}%)`;
    return null;
  }
  // amount
  if (Math.abs(sum - total) > 0.01) return `Los montos deben sumar ${total.toFixed(2)} (suman ${sum.toFixed(2)})`;
  return null;
}

export function SplitEditor({ members, totalAmount, splitType, onSplitTypeChange, splits, onSplitsChange, currency }: SplitEditorProps) {
  const error = validateSplits(splitType, splits, totalAmount);
  const equalShare = members.length > 0 ? totalAmount / members.length : 0;

  function updateValue(userId: string, value: number) {
    onSplitsChange(splits.map(s => (s.userId === userId ? { ...s, value } : s)));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">División</label>
        <select
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
          value={splitType}
          onChange={e => onSplitTypeChange(e.target.value as SplitType)}
        >
          <option value="equal">Equitativo</option>
          <option value="percentage">Porcentaje</option>
          <option value="amount">Monto</option>
        </select>
      </div>

      {splitType === 'equal' ? (
        <p className="text-xs text-slate-500">
          Cada miembro paga {formatCurrency(equalShare, currency)} ({members.length} miembros).
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {members.map(m => {
            const split = splits.find(s => s.userId === m.userId);
            return (
              <div key={m.userId} className="flex items-center gap-2">
                <span className="flex-1 text-sm text-slate-300 truncate">{m.username}</span>
                <input
                  type="number"
                  step="0.01"
                  className="w-28 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={split?.value ?? 0}
                  onChange={e => updateValue(m.userId, Number(e.target.value))}
                />
                <span className="text-xs text-slate-500 w-4">{splitType === 'percentage' ? '%' : ''}</span>
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
