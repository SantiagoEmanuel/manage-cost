import { Router, type Router as ExpressRouter } from 'express';
import { requireAuth } from '../../shared/middlewares/auth.middleware.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { createFixedExpenseSchema, updateFixedExpenseSchema } from './fixed-expenses.schema.js';
import * as controller from './fixed-expenses.controller.js';

const router: ExpressRouter = Router();
router.use(requireAuth);

router.get('/', controller.list);
router.post('/apply-monthly', controller.applyMonthly);
router.post('/', validate(createFixedExpenseSchema), controller.create);
router.patch('/:id', validate(updateFixedExpenseSchema), controller.update);
router.delete('/:id', controller.remove);

export { router as fixedExpensesRoutes };
