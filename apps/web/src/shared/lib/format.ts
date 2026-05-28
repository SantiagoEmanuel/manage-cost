export function formatCurrency(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateStr + 'T00:00:00'));
  } catch {
    return dateStr;
  }
}

export const CATEGORIES = [
  'general', 'alimentación', 'transporte', 'vivienda', 'salud', 'educación',
  'entretenimiento', 'ropa', 'tecnología', 'viaje', 'deporte', 'mascotas', 'otro',
];

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'debit', label: 'Débito' },
  { value: 'credit', label: 'Crédito' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'digital_wallet', label: 'Billetera virtual' },
];
