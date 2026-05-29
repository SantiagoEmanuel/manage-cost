import { expensesApi } from '../api/expenses.api';
import { formatDate } from '@/shared/lib/format';
import { PAYMENT_METHODS } from '@/shared/lib/format';
import type { Expense } from '@/shared/types';

/** Trae todos los gastos del rango paginando hasta el final. */
export async function fetchAllExpensesForMonth(from: string, to: string): Promise<Expense[]> {
  const all: Expense[] = [];
  let page = 1;
  for (;;) {
    const res = await expensesApi.list({ page, limit: 100, from, to });
    all.push(...res.data);
    if (page >= res.pagination.totalPages) break;
    page++;
  }
  return all;
}

function escapeCsv(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/** Genera y descarga un CSV con los gastos dados. */
export function exportExpensesToCSV(expenses: Expense[], filename: string): void {
  const header = ['fecha', 'descripción', 'categoría', 'método', 'monto', 'moneda'];
  const rows = expenses.map(e => [
    formatDate(e.date),
    e.description,
    e.category,
    PAYMENT_METHODS.find(m => m.value === e.paymentMethod)?.label ?? e.paymentMethod,
    String(e.amount),
    e.currency,
  ].map(escapeCsv).join(','));

  const csv = '﻿' + [header.map(escapeCsv).join(','), ...rows].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
