import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { formatCurrency } from '@/shared/lib/format';

interface TrendChartProps {
  data: { month: string; total: number }[];
  currency?: string;
}

function monthLabel(month: string): string {
  try {
    return new Date(month + '-01').toLocaleDateString('es-AR', { month: 'short' });
  } catch {
    return month;
  }
}

export function TrendChart({ data, currency }: TrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tickFormatter={monthLabel}
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          axisLine={{ stroke: '#1e293b' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          axisLine={{ stroke: '#1e293b' }}
          tickLine={false}
          width={48}
        />
        <Tooltip
          contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#e2e8f0' }}
          labelStyle={{ color: '#94a3b8' }}
          labelFormatter={(m) => monthLabel(String(m))}
          formatter={(value: number) => [formatCurrency(value, currency), 'Total']}
        />
        <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
