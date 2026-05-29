import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from './app-error.js';
import { logger } from '../logger/index.js';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      errors: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, code: err.code, message: err.message });
    return;
  }
  if (err instanceof Error && err.message.startsWith('CORS:')) {
    res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Origin not allowed' });
    return;
  }
  logger.error({ err, method: req.method, path: req.path }, 'Unhandled error');
  res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'Internal server error' });
}
