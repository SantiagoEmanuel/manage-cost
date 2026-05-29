import type { Request, Response, NextFunction } from 'express';
import { PushService } from './push.service.js';
import type { AuthenticatedRequest } from '../../shared/types/index.js';

const service = new PushService();

export async function getVapidKey(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ success: true, data: { publicKey: service.getVapidPublicKey() } });
  } catch (err) { next(err); }
}

export async function subscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    await service.subscribe(user.id, req.body);
    res.status(201).json({ success: true });
  } catch (err) { next(err); }
}

export async function unsubscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const endpoint = String((req.body as { endpoint?: string }).endpoint ?? '');
    await service.unsubscribe(endpoint);
    res.json({ success: true });
  } catch (err) { next(err); }
}
