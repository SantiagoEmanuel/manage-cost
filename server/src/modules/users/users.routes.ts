import { Router, type Router as ExpressRouter } from 'express';
import { requireAuth } from '../../shared/middlewares/auth.middleware.js';
import { validate, validateQuery } from '../../shared/middlewares/validate.middleware.js';
import { updateProfileSchema, changePasswordSchema, searchQuerySchema } from './users.schema.js';
import * as controller from './users.controller.js';

const router: ExpressRouter = Router();
router.use(requireAuth);

router.get('/me', controller.getMe);
router.patch('/me', validate(updateProfileSchema), controller.updateMe);
router.patch('/me/password', validate(changePasswordSchema), controller.changePassword);
router.get('/search', validateQuery(searchQuerySchema), controller.searchUsers);

export { router as usersRoutes };
