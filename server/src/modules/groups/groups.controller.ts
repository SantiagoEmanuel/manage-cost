import type { Request, Response, NextFunction } from 'express';
import { GroupsService } from './groups.service.js';
import type { AuthenticatedRequest } from '../../shared/types/index.js';

const service = new GroupsService();

function param(req: Request, key: string): string {
  return String((req.params as Record<string, string>)[key] ?? '');
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const data = await service.list(user.id);
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

export async function invite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const data = await service.invite(param(req, 'id'), user.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
}

export async function removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    await service.removeMember(param(req, 'id'), user.id, param(req, 'userId'));
    res.json({ success: true });
  } catch (err) { next(err); }
}

export async function listGroupExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const data = await service.listGroupExpenses(param(req, 'id'), user.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function createGroupExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const data = await service.createGroupExpense(param(req, 'id'), user.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
}

export async function deleteGroupExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    await service.deleteGroupExpense(param(req, 'id'), param(req, 'expId'), user.id);
    res.json({ success: true });
  } catch (err) { next(err); }
}
