import type { Request, Response, NextFunction } from 'express';
import { FixedExpensesService } from './fixed-expenses.service.js';
import type { AuthenticatedRequest } from '../../shared/types/index.js';

const service = new FixedExpensesService();

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const data = await service.list(user.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const data = await service.create(user.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const id = String((req.params as Record<string, string>)['id'] ?? '');
    const data = await service.update(user.id, id, req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const id = String((req.params as Record<string, string>)['id'] ?? '');
    await service.delete(user.id, id);
    res.json({ success: true });
  } catch (err) { next(err); }
}

export async function applyMonthly(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const data = await service.applyMonthly(user.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
