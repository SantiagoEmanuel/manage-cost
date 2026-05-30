import { useId, useState } from 'react';
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

// Gráfico de líneas en SVG puro — sin dependencias externas para evitar
// problemas de bundling/interop con librerías de charts.
export function TrendChart({ data, currency }: TrendChartProps) {
  const gradientId = useId();
  const [hover, setHover] = useState<number | null>(null);

  const width = 600;
  const height = 220;
  const padding = { top: 16, right: 16, bottom: 28, left: 56 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const max = Math.max(...data.map(d => d.total), 0);
  const min = Math.min(...data.map(d => d.total), 0);
  const range = max - min || 1;

  const x = (i: number) =>
    padding.left + (data.length <= 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const y = (v: number) => padding.top + plotH - ((v - min) / range) * plotH;

  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d.total).toFixed(1)}`)
    .join(' ');
  const areaPath =
    data.length > 0
      ? `${linePath} L ${x(data.length - 1).toFixed(1)} ${(padding.top + plotH).toFixed(1)} L ${x(0).toFixed(1)} ${(padding.top + plotH).toFixed(1)} Z`
      : '';

  // Líneas guía horizontales (4 divisiones).
  const gridLines = Array.from({ length: 4 }, (_, i) => {
    const v = min + (range * i) / 3;
    return { v, yPos: y(v) };
  });

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Grid + etiquetas eje Y */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={g.yPos}
              x2={width - padding.right}
              y2={g.yPos}
              stroke="#1e293b"
              strokeDasharray="3 3"
            />
            <text x={padding.left - 8} y={g.yPos + 4} textAnchor="end" fontSize={11} fill="#94a3b8">
              {formatCurrency(g.v, currency)}
            </text>
          </g>
        ))}

        {/* Área + línea */}
        {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
        {data.length > 1 && <path d={linePath} fill="none" stroke="#8b5cf6" strokeWidth={2} />}

        {/* Puntos + etiquetas eje X */}
        {data.map((d, i) => (
          <g key={d.month}>
            <text x={x(i)} y={height - 8} textAnchor="middle" fontSize={11} fill="#94a3b8">
              {monthLabel(d.month)}
            </text>
            <circle
              cx={x(i)}
              cy={y(d.total)}
              r={hover === i ? 5 : 3}
              fill="#8b5cf6"
              stroke="#0f172a"
              strokeWidth={1.5}
            />
            {/* Área sensible al hover */}
            <rect
              x={x(i) - plotW / Math.max(data.length, 1) / 2}
              y={padding.top}
              width={plotW / Math.max(data.length, 1)}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
            {hover === i && (
              <g>
                <rect
                  x={Math.min(Math.max(x(i) - 50, 0), width - 100)}
                  y={y(d.total) - 38}
                  width={100}
                  height={28}
                  rx={6}
                  fill="#0f172a"
                  stroke="#1e293b"
                />
                <text
                  x={Math.min(Math.max(x(i), 50), width - 50)}
                  y={y(d.total) - 20}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#e2e8f0"
                >
                  {formatCurrency(d.total, currency)}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
