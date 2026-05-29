import type { Request, Response, NextFunction } from 'express';
import { SettlementsService } from './settlements.service.js';
import { getValidatedQuery } from '../../shared/middlewares/validate.middleware.js';
import type { SettlementQuery } from './settlements.schema.js';
import type { AuthenticatedRequest } from '../../shared/types/index.js';

const service = new SettlementsService();

function param(req: Request, key: string): string {
  return String((req.params as Record<string, string>)[key] ?? '');
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const query = getValidatedQuery<SettlementQuery>(res);
    const data = await service.list(user.id, query?.groupId);
    res.json({ success: true, data });
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
