export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  currency: string;
  language: string;
  timezone?: string;
  createdAt?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface Expense {
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

export interface ExpenseStats {
  totalMonth: number;
  totalYear: number;
  byCategory: { category: string; total: number }[];
  byMethod: { method: string; total: number }[];
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  ownerId: string;
  createdAt: string;
  members: GroupMember[];
}

export interface GroupMember {
  id: string;
  userId: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  joinedAt: string;
}

export interface GroupExpense {
  id: string;
  groupId: string;
  payerId: string;
  payerUsername: string;
  amount: number;
  currency: string;
  description: string;
  category: string;
  paymentMethod: string;
  date: string;
  notes: string | null;
  createdAt: string;
  splits: { userId: string; username: string; amount: number }[];
}

export interface Debt {
  debtId: string;
  groupId: string;
  groupName?: string;
  creditorId?: string;
  creditorUsername?: string;
  debtorId?: string;
  debtorUsername?: string;
  amount: number;
  currency: string;
}

export interface BalanceSummary {
  iOwe: Debt[];
  theyOweMe: Debt[];
  totalIOwe: number;
  totalOwedToMe: number;
}

export interface Settlement {
  id: string;
  debtId: string;
  paidBy: string;
  amount: number;
  notes: string | null;
  receiptUrl: string | null;
  createdAt: string;
  debt?: { creditorId: string; debtorId: string; amount: number; currency: string; groupId: string };
}
