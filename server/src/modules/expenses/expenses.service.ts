import { v4 as uuidv4 } from 'uuid';
import { ExpensesRepository } from './expenses.repository.js';
import { NotFoundError } from '../../shared/errors/app-error.js';
import type { CreateExpenseInput, UpdateExpenseInput, ExpenseQuery } from './expenses.schema.js';
import type { ExpenseDto, ExpenseStatsDto } from './expenses.dto.js';
import type { Expense, CreditInstallment } from '../../db/schema/index.js';

function toDto(e: Expense, installment?: CreditInstallment | null): ExpenseDto {
  return {
    id: e.id, amount: e.amount, currency: e.currency, description: e.description,
    category: e.category, paymentMethod: e.paymentMethod, isPersonal: e.isPersonal,
    date: e.date, notes: e.notes, receiptUrl: e.receiptUrl,
    createdAt: e.createdAt, updatedAt: e.updatedAt,
    ...(installment && {
      installment: {
        totalInstallments: installment.totalInstallments,
        paidInstallments: installment.paidInstallments,
        installmentAmount: installment.installmentAmount,
        closingDate: installment.closingDate ?? null,
        dueDate: installment.dueDate ?? null,
      }
    }),
  };
}

export class ExpensesService {
  private readonly repo = new ExpensesRepository();

  async list(userId: string, query: ExpenseQuery) {
    const { rows, total } = await this.repo.findAll(userId, query);
    const installments = await Promise.all(rows.map(e => this.repo.findInstallment(e.id)));
    return {
      data: rows.map((e, i) => toDto(e, installments[i])),
      pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    };
  }

  async getById(id: string, userId: string): Promise<ExpenseDto> {
    const e = await this.repo.findById(id, userId);
    if (!e) throw new NotFoundError('Expense');
    const installment = await this.repo.findInstallment(e.id);
    return toDto(e, installment);
  }

  async create(userId: string, input: CreateExpenseInput): Promise<ExpenseDto> {
    const id = uuidv4();
    const expense = await this.repo.create({
      id, payerId: userId, amount: input.amount, currency: input.currency,
      description: input.description, category: input.category,
      paymentMethod: input.paymentMethod, isPersonal: true,
      date: input.date, notes: input.notes, receiptUrl: input.receiptUrl,
    });
    let installment = null;
    if (input.paymentMethod === 'credit' && input.installments && input.installments > 1) {
      const instData: Parameters<ExpensesRepository['createInstallment']>[0] = {
        id: uuidv4(), expenseId: id, userId,
        totalAmount: input.amount,
        installmentAmount: input.amount / input.installments,
        totalInstallments: input.installments,
      };
      if (input.closingDate !== undefined) instData.closingDate = input.closingDate;
      if (input.dueDate !== undefined) instData.dueDate = input.dueDate;
      installment = await this.repo.createInstallment(instData);
    }
    return toDto(expense, installment);
  }

  async update(id: string, userId: string, input: UpdateExpenseInput): Promise<ExpenseDto> {
    const existing = await this.repo.findById(id, userId);
    if (!existing) throw new NotFoundError('Expense');
    const updated = await this.repo.update(id, userId, {
      ...(input.amount !== undefined && { amount: input.amount }),
      ...(input.currency !== undefined && { currency: input.currency }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.paymentMethod !== undefined && { paymentMethod: input.paymentMethod }),
      ...(input.date !== undefined && { date: input.date }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.receiptUrl !== undefined && { receiptUrl: input.receiptUrl }),
    });
    if (!updated) throw new NotFoundError('Expense');
    const installment = await this.repo.findInstallment(updated.id);
    return toDto(updated, installment);
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.repo.findById(id, userId);
    if (!existing) throw new NotFoundError('Expense');
    await this.repo.softDelete(id, userId);
  }

  async getStats(userId: string): Promise<ExpenseStatsDto> {
    const all = await this.repo.findAllByUser(userId);
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const yearStart = `${now.getFullYear()}-01-01`;

    const totalMonth = all.filter(e => e.date >= monthStart).reduce((s, e) => s + e.amount, 0);
    const totalYear = all.filter(e => e.date >= yearStart).reduce((s, e) => s + e.amount, 0);

    const byCategory = Object.entries(
      all.reduce<Record<string, number>>((acc, e) => { acc[e.category] = (acc[e.category] ?? 0) + e.amount; return acc; }, {})
    ).map(([category, total]) => ({ category, total }));

    const byMethod = Object.entries(
      all.reduce<Record<string, number>>((acc, e) => { acc[e.paymentMethod] = (acc[e.paymentMethod] ?? 0) + e.amount; return acc; }, {})
    ).map(([method, total]) => ({ method, total }));

    return { totalMonth, totalYear, byCategory, byMethod };
  }
}
