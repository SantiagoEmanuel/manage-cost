import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

/**
 * Valida y reemplaza el body de la request.
 * (req.body es escribible en Express 5)
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Valida la query string. En Express 5 `req.query` es de solo lectura (getter),
 * por lo que el resultado parseado se expone en `res.locals.query`.
 * Los controllers deben leer la query validada con `getValidatedQuery`.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      res.locals['query'] = schema.parse(req.query);
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** Lee la query validada por `validateQuery` desde res.locals. */
export function getValidatedQuery<T>(res: Response): T {
  return res.locals['query'] as T;
}
