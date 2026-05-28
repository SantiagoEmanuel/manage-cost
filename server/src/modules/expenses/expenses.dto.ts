export interface ExpenseDto {
  id: string;
  amount: number;
  currency: string;
  description: string;
  category: string;
  paymentMethod: string;
  isPersonal: boolean;
  date: string;
  notes: string | null;
  receiptUrl: string | null;
  createdAt: string;
  updatedAt: string;
  installment?: {
    totalInstallments: number;
    paidInstallments: number;
    installmentAmount: number;
    closingDate: string | null;
    dueDate: string | null;
  };
}

export interface ExpenseStatsDto {
  totalMonth: number;
  totalYear: number;
  byCategory: { category: string; total: number }[];
  byMethod: { method: string; total: number }[];
}
