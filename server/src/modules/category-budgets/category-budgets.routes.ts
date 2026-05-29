import { Router, type Router as ExpressRouter } from 'express';
import { requireAuth } from '../../shared/middlewares/auth.middleware.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { createCategoryBudgetSchema } from './category-budgets.schema.js';
import * as controller from './category-budgets.controller.js';

const router: ExpressRouter = Router();
router.use(requireAuth);

router.get('/', controller.list);
router.put('/', validate(createCategoryBudgetSchema), controller.upsert);
router.delete('/:id', controller.remove);

export { router as categoryBudgetsRoutes };
