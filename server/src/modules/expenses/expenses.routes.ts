import { Router, type Router as ExpressRouter } from 'express';
import { requireAuth } from '../../shared/middlewares/auth.middleware.js';

const router: ExpressRouter = Router();
router.use(requireAuth);

export { router as expensesRoutes };
