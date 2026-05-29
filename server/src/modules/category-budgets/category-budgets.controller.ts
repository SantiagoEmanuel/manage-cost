import type { Request, Response, NextFunction } from 'express';
import { CategoryBudgetsService } from './category-budgets.service.js';
import type { AuthenticatedRequest } from '../../shared/types/index.js';

const service = new CategoryBudgetsService();

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const data = await service.list(user.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function upsert(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const data = await service.upsert(user.id, req.body);
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
