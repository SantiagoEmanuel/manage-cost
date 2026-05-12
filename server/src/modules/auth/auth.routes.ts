import { Router, type Router as ExpressRouter } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { requireAuth } from '../../shared/middlewares/auth.middleware.js';
import { RATE_LIMITS } from '../../shared/constants/index.js';
import { registerSchema, loginSchema } from './auth.schema.js';
import * as controller from './auth.controller.js';

const router: ExpressRouter = Router();
const authLimiter = rateLimit({ ...RATE_LIMITS.AUTH, standardHeaders: true, legacyHeaders: false,
  message: { success: false, code: 'RATE_LIMIT', message: 'Too many attempts, try again later' } });

router.post('/register', authLimiter, validate(registerSchema), controller.register);
router.post('/login', authLimiter, validate(loginSchema), controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);
router.get('/me', requireAuth, controller.me);

export { router as authRoutes };
