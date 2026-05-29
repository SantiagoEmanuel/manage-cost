import { Router, type Router as ExpressRouter } from 'express';
import { requireAuth } from '../../shared/middlewares/auth.middleware.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { createGroupSchema, updateGroupSchema, inviteSchema, createGroupExpenseSchema, updateGroupExpenseSchema } from './groups.schema.js';
import * as controller from './groups.controller.js';

const router: ExpressRouter = Router();
router.use(requireAuth);

router.get('/', controller.list);
router.post('/', validate(createGroupSchema), controller.create);
router.get('/:id', controller.getById);
router.patch('/:id', validate(updateGroupSchema), controller.update);
router.delete('/:id', controller.remove);
router.post('/:id/invite', validate(inviteSchema), controller.invite);
router.delete('/:id/members/:userId', controller.removeMember);
router.post('/:id/simplify-debts', controller.simplifyDebts);
router.get('/:id/expenses', controller.listGroupExpenses);
router.post('/:id/expenses', validate(createGroupExpenseSchema), controller.createGroupExpense);
router.patch('/:id/expenses/:expId', validate(updateGroupExpenseSchema), controller.updateGroupExpense);
router.delete('/:id/expenses/:expId', controller.deleteGroupExpense);

export { router as groupsRoutes };
