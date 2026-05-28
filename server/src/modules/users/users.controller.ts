import type { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service.js';
import type { AuthenticatedRequest } from '../../shared/types/index.js';

const service = new UsersService();

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const profile = await service.getProfile(user.id);
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
}

export async function updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const profile = await service.updateProfile(user.id, req.body);
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
}

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    await service.changePassword(user.id, req.body);
    res.json({ success: true, message: 'Password updated' });
  } catch (err) { next(err); }
}

export async function searchUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const q = String(req.query['q'] ?? '');
    const results = await service.searchUsers(q, user.id);
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
}
