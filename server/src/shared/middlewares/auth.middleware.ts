import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { UnauthorizedError } from '../errors/app-error.js';
import { COOKIE_NAMES } from '../constants/index.js';
import type { AuthenticatedRequest } from '../types/index.js';

interface AccessTokenPayload { sub: string; email: string; username: string; }

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token: string | undefined = req.cookies[COOKIE_NAMES.ACCESS_TOKEN];
    if (!token) throw new UnauthorizedError('No access token provided');
    const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as AccessTokenPayload;
    (req as AuthenticatedRequest).user = { id: payload.sub, email: payload.email, username: payload.username };
    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) { next(err); return; }
    next(new UnauthorizedError('Invalid or expired access token'));
  }
}
