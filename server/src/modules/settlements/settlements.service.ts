import { v4 as uuidv4 } from 'uuid';
import { SettlementsRepository } from './settlements.repository.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../shared/errors/app-error.js';
import type { CreateSettlementInput } from './settlements.schema.js';

export class SettlementsService {
  private readonly repo = new SettlementsRepository();

  async list(userId: string, groupId?: string) {
    return this.repo.findUserSettlements(userId, groupId);
  }

  async getById(id: string, userId: string) {
    const s = await this.repo.findById(id);
    if (!s) throw new NotFoundError('Settlement');
    const debt = await this.repo.findDebtById(s.debtId);
    if (!debt) throw new NotFoundError('Debt');
    if (debt.creditorId !== userId && debt.debtorId !== userId) throw new ForbiddenError();
    return { ...s, debt };
  }

  async create(userId: string, input: CreateSettlementInput) {
    const debt = await this.repo.findDebtById(input.debtId);
    if (!debt) throw new NotFoundError('Debt');
    if (debt.debtorId !== userId) throw new ForbiddenError('Only the debtor can settle a debt');
    if (debt.status === 'paid' || debt.amount <= 0) {
      throw new ValidationError('Esta deuda ya está saldada');
    }
    // Tolerancia de centavos por errores de redondeo en divisiones.
    if (input.amount > debt.amount + 0.01) {
      throw new ValidationError('El monto no puede superar la deuda pendiente');
    }

    const settlement = await this.repo.create({
      id: uuidv4(),
      debtId: input.debtId,
      paidBy: userId,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      reference: input.reference ?? null,
      ...(input.paidAt ? { paidAt: input.paidAt } : {}),
      notes: input.notes ?? null,
      receiptUrl: input.receiptUrl ?? null,
    });
    await this.repo.updateDebtAfterSettlement(input.debtId, input.amount);
    return settlement;
  }
}
