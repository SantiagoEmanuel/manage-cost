import { Router, type Router as ExpressRouter } from 'express';
import { requireAuth } from '../../shared/middlewares/auth.middleware.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { subscribeSchema } from './push.schema.js';
import * as controller from './push.controller.js';

const router: ExpressRouter = Router();

router.get('/vapid-key', controller.getVapidKey);
router.use(requireAuth);
router.post('/subscribe', validate(subscribeSchema), controller.subscribe);
router.delete('/subscribe', controller.unsubscribe);

export { router as pushRoutes };
