import type { Request, Response, NextFunction } from 'express';
import { ExpensesService } from './expenses.service.js';
import { getValidatedQuery } from '../../shared/middlewares/validate.middleware.js';
import type { AuthenticatedRequest } from '../../shared/types/index.js';
import type { ExpenseQuery, HistoryQuery } from './expenses.schema.js';

const service = new ExpensesService();

function param(req: Request, key: string): string {
  return String((req.params as Record<string, string>)[key] ?? '');
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const query = getValidatedQuery<ExpenseQuery>(res);
    const result = await service.list(user.id, query);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const data = await service.getById(param(req, 'id'), user.id);
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
    const data = await service.update(param(req, 'id'), user.id, req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    await service.delete(param(req, 'id'), user.id);
    res.json({ success: true });
  } catch (err) { next(err); }
}

export async function getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const query = getValidatedQuery<HistoryQuery>(res);
    const data = await service.getHistory(user.id, query.months);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const data = await service.getStats(user.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}
