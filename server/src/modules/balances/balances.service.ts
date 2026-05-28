import { BalancesRepository } from './balances.repository.js';

export interface BalanceSummaryDto {
  iOwe: { debtId: string; groupId: string; groupName: string; creditorId: string; creditorUsername: string; amount: number; currency: string }[];
  theyOweMe: { debtId: string; groupId: string; groupName: string; debtorId: string; debtorUsername: string; amount: number; currency: string }[];
  totalIOwe: number;
  totalOwedToMe: number;
}

export class BalancesService {
  private readonly repo = new BalancesRepository();

  async getSummary(userId: string): Promise<BalanceSummaryDto> {
    const debts = await this.repo.findUserDebts(userId);
    const iOwe = debts
      .filter(d => d.debtorId === userId)
      .map(d => ({ debtId: d.id, groupId: d.groupId, groupName: d.groupName, creditorId: d.creditorId, creditorUsername: d.creditorUsername, amount: d.amount, currency: d.currency }));
    const theyOweMe = debts
      .filter(d => d.creditorId === userId)
      .map(d => ({ debtId: d.id, groupId: d.groupId, groupName: d.groupName, debtorId: d.debtorId, debtorUsername: d.debtorUsername, amount: d.amount, currency: d.currency }));
    return { iOwe, theyOweMe, totalIOwe: iOwe.reduce((s, d) => s + d.amount, 0), totalOwedToMe: theyOweMe.reduce((s, d) => s + d.amount, 0) };
  }

  async getGroupBalances(groupId: string, userId: string) {
    const debts = await this.repo.findGroupDebts(groupId, userId);
    const iOwe = debts.filter(d => d.debtorId === userId).map(d => ({ debtId: d.id, creditorId: d.creditorId, creditorUsername: d.creditorUsername, amount: d.amount, currency: d.currency }));
    const theyOweMe = debts.filter(d => d.creditorId === userId).map(d => ({ debtId: d.id, debtorId: d.debtorId, debtorUsername: d.debtorUsername, amount: d.amount, currency: d.currency }));
    return { iOwe, theyOweMe };
  }
}
