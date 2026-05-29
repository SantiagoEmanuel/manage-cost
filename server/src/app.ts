import express, { type Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import webpush from 'web-push';
import { corsOrigins, vapidPublicKey, vapidPrivateKey, vapidSubject } from './config/env.js';
import { errorHandler } from './shared/errors/error-handler.js';
import { RATE_LIMITS } from './shared/constants/index.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { expensesRoutes } from './modules/expenses/expenses.routes.js';
import { groupsRoutes } from './modules/groups/groups.routes.js';
import { balancesRoutes } from './modules/balances/balances.routes.js';
import { settlementsRoutes } from './modules/settlements/settlements.routes.js';
import { fixedExpensesRoutes } from './modules/fixed-expenses/fixed-expenses.routes.js';
import { categoryBudgetsRoutes } from './modules/category-budgets/category-budgets.routes.js';
import { pushRoutes } from './modules/push/push.routes.js';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

const app: Application = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(rateLimit({ ...RATE_LIMITS.GENERAL, standardHeaders: true, legacyHeaders: false }));

app.get('/health', (_req, res) => { res.json({ status: 'ok', timestamp: new Date().toISOString() }); });

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/balances', balancesRoutes);
app.use('/api/settlements', settlementsRoutes);
app.use('/api/fixed-expenses', fixedExpensesRoutes);
app.use('/api/category-budgets', categoryBudgetsRoutes);
app.use('/api/push', pushRoutes);

app.use(errorHandler);
export { app };
