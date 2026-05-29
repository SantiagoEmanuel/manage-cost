import { Router, type Router as ExpressRouter } from 'express';
import { requireAuth } from '../../shared/middlewares/auth.middleware.js';
import { validate, validateQuery } from '../../shared/middlewares/validate.middleware.js';
import { createSettlementSchema, settlementQuerySchema } from './settlements.schema.js';
import * as controller from './settlements.controller.js';

const router: ExpressRouter = Router();
router.use(requireAuth);

router.get('/', validateQuery(settlementQuerySchema), controller.list);
router.get('/:id', controller.getById);
router.post('/', validate(createSettlementSchema), controller.create);

export { router as settlementsRoutes };
