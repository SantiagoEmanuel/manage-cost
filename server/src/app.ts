import express, { type Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { corsOrigins } from './config/env.js';
import { errorHandler } from './shared/errors/error-handler.js';
import { RATE_LIMITS } from './shared/constants/index.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { expensesRoutes } from './modules/expenses/expenses.routes.js';
import { groupsRoutes } from './modules/groups/groups.routes.js';
import { balancesRoutes } from './modules/balances/balances.routes.js';
import { settlementsRoutes } from './modules/settlements/settlements.routes.js';

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

app.use(errorHandler);
export { app };
