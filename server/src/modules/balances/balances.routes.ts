import { Router, type Router as ExpressRouter } from 'express';
import { requireAuth } from '../../shared/middlewares/auth.middleware.js';
import * as controller from './balances.controller.js';

const router: ExpressRouter = Router();
router.use(requireAuth);

router.get('/', controller.getSummary);
router.get('/groups/:groupId', controller.getGroupBalances);

export { router as balancesRoutes };
