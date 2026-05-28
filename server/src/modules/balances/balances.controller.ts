import type { Request, Response, NextFunction } from 'express';
import { BalancesService } from './balances.service.js';
import type { AuthenticatedRequest } from '../../shared/types/index.js';

const service = new BalancesService();

function param(req: Request, key: string): string {
  return String((req.params as Record<string, string>)[key] ?? '');
}

export async function getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const data = await service.getSummary(user.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function getGroupBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const data = await service.getGroupBalances(param(req, 'groupId'), user.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
