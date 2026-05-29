import { Router, type Router as ExpressRouter } from 'express';
import { requireAuth } from '../../shared/middlewares/auth.middleware.js';
import { validate, validateQuery } from '../../shared/middlewares/validate.middleware.js';
import { createExpenseSchema, updateExpenseSchema, expenseQuerySchema, historyQuerySchema } from './expenses.schema.js';
import * as controller from './expenses.controller.js';

const router: ExpressRouter = Router();
router.use(requireAuth);

router.get('/', validateQuery(expenseQuerySchema), controller.list);
router.get('/stats', controller.getStats);
router.get('/history', validateQuery(historyQuerySchema), controller.getHistory);
router.get('/:id', controller.getById);
router.post('/', validate(createExpenseSchema), controller.create);
router.patch('/:id', validate(updateExpenseSchema), controller.update);
router.delete('/:id', controller.remove);

export { router as expensesRoutes };
