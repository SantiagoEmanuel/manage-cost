#!/bin/bash
set -e

echo "Creando estructura del server..."

# ── Raíz del monorepo ─────────────────────────────────────────────────────────

cat > pnpm-workspace.yaml << 'EOF'
packages:
  - "apps/*"
  - "packages/*"
  - "server"
EOF

cat > .npmrc << 'EOF'
approve-builds=true
EOF

# ── server/package.json ───────────────────────────────────────────────────────

cat > server/package.json << 'EOF'
{
  "name": "server",
  "version": "1.0.0",
  "description": "API server for manage-cost",
  "main": "dist/server.js",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "test": "jest"
  },
  "packageManager": "pnpm@10.33.0",
  "dependencies": {
    "@libsql/client": "^0.15.6",
    "bcrypt": "^6.0.0",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.6",
    "dotenv": "^16.5.0",
    "drizzle-orm": "^0.44.0",
    "express": "^5.2.1",
    "express-rate-limit": "^7.5.0",
    "helmet": "^8.1.0",
    "jsonwebtoken": "^9.0.3",
    "pino": "^9.7.0",
    "uuid": "^11.1.0",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/cookie-parser": "^1.4.9",
    "@types/cors": "^2.8.18",
    "@types/express": "^5.0.3",
    "@types/jsonwebtoken": "^9.0.9",
    "@types/node": "^24.0.0",
    "@types/uuid": "^10.0.0",
    "drizzle-kit": "^0.31.1",
    "pino-pretty": "^13.0.0",
    "tsx": "^4.20.3",
    "typescript": "^5.8.3"
  }
}
EOF

# ── server/tsconfig.json ──────────────────────────────────────────────────────

cat > server/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# ── server/.env.example ───────────────────────────────────────────────────────

cat > server/.env.example << 'EOF'
NODE_ENV=development
PORT=3000

# Turso (local dev: file:./local.db | production: libsql://...)
DATABASE_URL=file:./local.db
DATABASE_AUTH_TOKEN=

# Secrets — mínimo 32 caracteres, generados con: openssl rand -hex 32
ACCESS_TOKEN_SECRET=change_me_min_32_chars_long_secret_key_here
REFRESH_TOKEN_SECRET=change_me_another_32_chars_long_secret_key

# Expiry
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d

# CORS
CORS_ORIGIN=http://localhost:5173
EOF

# ── server/drizzle.config.ts ──────────────────────────────────────────────────

cat > server/drizzle.config.ts << 'EOF'
import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'turso',
  dbCredentials: {
    url: process.env['DATABASE_URL']!,
    authToken: process.env['DATABASE_AUTH_TOKEN'],
  },
});
EOF

# ── Directorios ───────────────────────────────────────────────────────────────

mkdir -p server/src/config
mkdir -p server/src/db/schema
mkdir -p server/src/shared/constants
mkdir -p server/src/shared/errors
mkdir -p server/src/shared/logger
mkdir -p server/src/shared/types
mkdir -p server/src/shared/middlewares
mkdir -p server/src/modules/auth
mkdir -p server/src/modules/users
mkdir -p server/src/modules/expenses
mkdir -p server/src/modules/groups
mkdir -p server/src/modules/balances
mkdir -p server/src/modules/settlements

# ── server/src/config/env.ts ──────────────────────────────────────────────────

cat > server/src/config/env.ts << 'EOF'
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  ACCESS_TOKEN_SECRET: z.string().min(32, 'ACCESS_TOKEN_SECRET must be at least 32 chars'),
  REFRESH_TOKEN_SECRET: z.string().min(32, 'REFRESH_TOKEN_SECRET must be at least 32 chars'),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
EOF

# ── server/src/db/index.ts ────────────────────────────────────────────────────

cat > server/src/db/index.ts << 'EOF'
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { env } from '../config/env.js';
import * as schema from './schema/index.js';

const client = createClient({
  url: env.DATABASE_URL,
  ...(env.DATABASE_AUTH_TOKEN !== undefined && { authToken: env.DATABASE_AUTH_TOKEN }),
});

export const db = drizzle(client, { schema });
export type DB = typeof db;
EOF

# ── DB Schema ─────────────────────────────────────────────────────────────────

cat > server/src/db/schema/users.ts << 'EOF'
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  avatarUrl: text('avatar_url'),
  currency: text('currency').notNull().default('USD'),
  language: text('language').notNull().default('es'),
  timezone: text('timezone').notNull().default('UTC'),
  createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
  updatedAt: text('updated_at').notNull().default(sql`(current_timestamp)`),
  deletedAt: text('deleted_at'),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
EOF

cat > server/src/db/schema/sessions.ts << 'EOF'
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  isRevoked: integer('is_revoked', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
});

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
EOF

cat > server/src/db/schema/groups.ts << 'EOF'
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';

export const groups = sqliteTable('groups', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id),
  currency: text('currency').notNull().default('USD'),
  createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
  updatedAt: text('updated_at').notNull().default(sql`(current_timestamp)`),
  deletedAt: text('deleted_at'),
});

export const groupMembers = sqliteTable('group_members', {
  id: text('id').primaryKey(),
  groupId: text('group_id')
    .notNull()
    .references(() => groups.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['owner', 'admin', 'member'] }).notNull().default('member'),
  joinedAt: text('joined_at').notNull().default(sql`(current_timestamp)`),
});

export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type GroupMember = typeof groupMembers.$inferSelect;
export type NewGroupMember = typeof groupMembers.$inferInsert;
EOF

cat > server/src/db/schema/expenses.ts << 'EOF'
import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';
import { groups } from './groups.js';

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  groupId: text('group_id').references(() => groups.id, { onDelete: 'cascade' }),
  payerId: text('payer_id')
    .notNull()
    .references(() => users.id),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('USD'),
  description: text('description').notNull(),
  category: text('category').notNull().default('general'),
  paymentMethod: text('payment_method', {
    enum: ['cash', 'debit', 'credit', 'transfer', 'digital_wallet'],
  })
    .notNull()
    .default('cash'),
  isPersonal: integer('is_personal', { mode: 'boolean' }).notNull().default(false),
  date: text('date').notNull(),
  notes: text('notes'),
  receiptUrl: text('receipt_url'),
  createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
  updatedAt: text('updated_at').notNull().default(sql`(current_timestamp)`),
  deletedAt: text('deleted_at'),
});

export const expenseSplits = sqliteTable('expense_splits', {
  id: text('id').primaryKey(),
  expenseId: text('expense_id')
    .notNull()
    .references(() => expenses.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  amount: real('amount').notNull(),
  createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
});

export const creditInstallments = sqliteTable('credit_installments', {
  id: text('id').primaryKey(),
  expenseId: text('expense_id')
    .notNull()
    .references(() => expenses.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  totalAmount: real('total_amount').notNull(),
  installmentAmount: real('installment_amount').notNull(),
  totalInstallments: integer('total_installments').notNull(),
  paidInstallments: integer('paid_installments').notNull().default(0),
  closingDate: text('closing_date'),
  dueDate: text('due_date'),
  createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
});

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
export type ExpenseSplit = typeof expenseSplits.$inferSelect;
export type CreditInstallment = typeof creditInstallments.$inferSelect;
EOF

cat > server/src/db/schema/settlements.ts << 'EOF'
import { sqliteTable, text, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';
import { groups } from './groups.js';

export const debts = sqliteTable('debts', {
  id: text('id').primaryKey(),
  groupId: text('group_id')
    .notNull()
    .references(() => groups.id, { onDelete: 'cascade' }),
  creditorId: text('creditor_id')
    .notNull()
    .references(() => users.id),
  debtorId: text('debtor_id')
    .notNull()
    .references(() => users.id),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('USD'),
  status: text('status', { enum: ['pending', 'partial', 'paid', 'overdue'] })
    .notNull()
    .default('pending'),
  createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
  updatedAt: text('updated_at').notNull().default(sql`(current_timestamp)`),
});

export const settlements = sqliteTable('settlements', {
  id: text('id').primaryKey(),
  debtId: text('debt_id')
    .notNull()
    .references(() => debts.id),
  paidBy: text('paid_by')
    .notNull()
    .references(() => users.id),
  amount: real('amount').notNull(),
  notes: text('notes'),
  receiptUrl: text('receipt_url'),
  createdAt: text('created_at').notNull().default(sql`(current_timestamp)`),
});

export type Debt = typeof debts.$inferSelect;
export type NewDebt = typeof debts.$inferInsert;
export type Settlement = typeof settlements.$inferSelect;
export type NewSettlement = typeof settlements.$inferInsert;
EOF

cat > server/src/db/schema/index.ts << 'EOF'
export * from './users.js';
export * from './sessions.js';
export * from './groups.js';
export * from './expenses.js';
export * from './settlements.js';
EOF

# ── Shared ────────────────────────────────────────────────────────────────────

cat > server/src/shared/constants/index.ts << 'EOF'
export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

export const RATE_LIMITS = {
  AUTH: { windowMs: 15 * 60 * 1000, max: 5 },
  GENERAL: { windowMs: 15 * 60 * 1000, max: 100 },
} as const;

export const BCRYPT_ROUNDS = 12;
export const REFRESH_TOKEN_DAYS = 30;
export const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60;
EOF

cat > server/src/shared/errors/app-error.ts << 'EOF'
export class AppError extends Error {
  constructor(
    public override readonly message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) { super(message, 400, 'VALIDATION_ERROR'); }
}
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') { super(message, 401, 'UNAUTHORIZED'); }
}
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') { super(message, 403, 'FORBIDDEN'); }
}
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') { super(`${resource} not found`, 404, 'NOT_FOUND'); }
}
export class ConflictError extends AppError {
  constructor(message: string) { super(message, 409, 'CONFLICT'); }
}
EOF

cat > server/src/shared/errors/error-handler.ts << 'EOF'
import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from './app-error.js';
import { logger } from '../logger/index.js';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      errors: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, code: err.code, message: err.message });
    return;
  }
  logger.error({ err, method: req.method, path: req.path }, 'Unhandled error');
  res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'Internal server error' });
}
EOF

cat > server/src/shared/logger/index.ts << 'EOF'
import pino from 'pino';
import { env } from '../../config/env.js';

export const logger =
  env.NODE_ENV !== 'production'
    ? pino({ level: 'debug', transport: { target: 'pino-pretty', options: { colorize: true } } })
    : pino({ level: 'info' });
EOF

cat > server/src/shared/types/index.ts << 'EOF'
import type { Request } from 'express';

export interface AuthPayload { id: string; email: string; username: string; }
export interface AuthenticatedRequest extends Request { user: AuthPayload; }
export interface ApiResponse<T = unknown> { success: boolean; data?: T; message?: string; }
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: { page: number; limit: number; total: number; totalPages: number; };
}
export interface PaginationQuery { page?: number; limit?: number; }
EOF

cat > server/src/shared/middlewares/auth.middleware.ts << 'EOF'
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { UnauthorizedError } from '../errors/app-error.js';
import { COOKIE_NAMES } from '../constants/index.js';
import type { AuthenticatedRequest } from '../types/index.js';

interface AccessTokenPayload { sub: string; email: string; username: string; }

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token: string | undefined = req.cookies[COOKIE_NAMES.ACCESS_TOKEN];
    if (!token) throw new UnauthorizedError('No access token provided');
    const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as AccessTokenPayload;
    (req as AuthenticatedRequest).user = { id: payload.sub, email: payload.email, username: payload.username };
    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) { next(err); return; }
    next(new UnauthorizedError('Invalid or expired access token'));
  }
}
EOF

cat > server/src/shared/middlewares/validate.middleware.ts << 'EOF'
import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.body = schema.parse(req.body);
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.query = schema.parse(req.query) as typeof req.query;
    next();
  };
}
EOF

# ── Módulo Auth ───────────────────────────────────────────────────────────────

cat > server/src/modules/auth/auth.schema.ts << 'EOF'
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores'),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
EOF

cat > server/src/modules/auth/auth.dto.ts << 'EOF'
export interface UserDto {
  id: string; email: string; username: string;
  avatarUrl: string | null; currency: string; language: string;
}
export interface AuthResponseDto { user: UserDto; }
EOF

cat > server/src/modules/auth/auth.repository.ts << 'EOF'
import { eq, and } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users, sessions } from '../../db/schema/index.js';
import type { NewUser, NewSession } from '../../db/schema/index.js';

export class AuthRepository {
  findUserByEmail(email: string) { return db.query.users.findFirst({ where: eq(users.email, email) }); }
  findUserById(id: string) { return db.query.users.findFirst({ where: eq(users.id, id) }); }
  findUserByUsername(username: string) { return db.query.users.findFirst({ where: eq(users.username, username) }); }
  async createUser(data: NewUser) { const [u] = await db.insert(users).values(data).returning(); return u!; }
  async createSession(data: NewSession) { const [s] = await db.insert(sessions).values(data).returning(); return s!; }
  findSessionByTokenHash(tokenHash: string) {
    return db.query.sessions.findFirst({
      where: and(eq(sessions.tokenHash, tokenHash), eq(sessions.isRevoked, false)),
    });
  }
  async revokeSession(id: string) { await db.update(sessions).set({ isRevoked: true }).where(eq(sessions.id, id)); }
  async revokeAllUserSessions(userId: string) { await db.update(sessions).set({ isRevoked: true }).where(eq(sessions.userId, userId)); }
}
EOF

cat > server/src/modules/auth/auth.service.ts << 'EOF'
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { AuthRepository } from './auth.repository.js';
import { env } from '../../config/env.js';
import { ConflictError, UnauthorizedError } from '../../shared/errors/app-error.js';
import { BCRYPT_ROUNDS, REFRESH_TOKEN_DAYS, ACCESS_TOKEN_EXPIRY_SECONDS } from '../../shared/constants/index.js';
import type { RegisterInput, LoginInput } from './auth.schema.js';
import type { UserDto } from './auth.dto.js';

interface TokenMeta { userAgent?: string; ipAddress?: string; }
interface TokenPair { accessToken: string; refreshToken: string; expiresAt: Date; }

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function buildUserDto(user: { id: string; email: string; username: string; avatarUrl: string | null; currency: string; language: string }): UserDto {
  return { id: user.id, email: user.email, username: user.username, avatarUrl: user.avatarUrl, currency: user.currency, language: user.language };
}

export class AuthService {
  private readonly repo = new AuthRepository();

  async register(input: RegisterInput): Promise<{ user: Pick<UserDto, 'id' | 'email' | 'username'> }> {
    const [existingEmail, existingUsername] = await Promise.all([
      this.repo.findUserByEmail(input.email),
      this.repo.findUserByUsername(input.username),
    ]);
    if (existingEmail) throw new ConflictError('Email already in use');
    if (existingUsername) throw new ConflictError('Username already taken');
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = await this.repo.createUser({ id: uuidv4(), email: input.email, username: input.username, passwordHash });
    return { user: { id: user.id, email: user.email, username: user.username } };
  }

  async login(input: LoginInput, meta: TokenMeta): Promise<{ user: UserDto } & TokenPair> {
    const user = await this.repo.findUserByEmail(input.email);
    if (!user || user.deletedAt) throw new UnauthorizedError('Invalid credentials');
    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Invalid credentials');
    const tokens = await this.createTokenPair(user.id, meta);
    return { user: buildUserDto(user), ...tokens };
  }

  async refresh(rawRefreshToken: string, meta: TokenMeta): Promise<TokenPair> {
    const tokenHash = hashToken(rawRefreshToken);
    const session = await this.repo.findSessionByTokenHash(tokenHash);
    if (!session) throw new UnauthorizedError('Invalid session');
    if (new Date(session.expiresAt) < new Date()) {
      await this.repo.revokeSession(session.id);
      throw new UnauthorizedError('Session expired');
    }
    await this.repo.revokeSession(session.id);
    return this.createTokenPair(session.userId, meta);
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = hashToken(rawRefreshToken);
    const session = await this.repo.findSessionByTokenHash(tokenHash);
    if (session) await this.repo.revokeSession(session.id);
  }

  async logoutAll(userId: string): Promise<void> { await this.repo.revokeAllUserSessions(userId); }

  private async createTokenPair(userId: string, meta: TokenMeta): Promise<TokenPair> {
    const user = await this.repo.findUserById(userId);
    if (!user) throw new UnauthorizedError('User not found');
    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, username: user.username },
      env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS },
    );
    const rawRefreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);
    await this.repo.createSession({ id: uuidv4(), userId: user.id, tokenHash, expiresAt: expiresAt.toISOString(), userAgent: meta.userAgent, ipAddress: meta.ipAddress });
    return { accessToken, refreshToken: rawRefreshToken, expiresAt };
  }
}
EOF

cat > server/src/modules/auth/auth.controller.ts << 'EOF'
import type { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { COOKIE_NAMES, REFRESH_TOKEN_DAYS } from '../../shared/constants/index.js';
import { env } from '../../config/env.js';
import type { AuthenticatedRequest } from '../../shared/types/index.js';

const service = new AuthService();
const cookieBase = { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'strict' as const, path: '/' };
const ACCESS_MAX_AGE = 15 * 60 * 1000;
const REFRESH_MAX_AGE = REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000;

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { const { user } = await service.register(req.body); res.status(201).json({ success: true, data: { user } }); }
  catch (err) { next(err); }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const meta = {
      ...(req.headers['user-agent'] !== undefined && { userAgent: req.headers['user-agent'] }),
      ...(req.ip !== undefined && { ipAddress: req.ip }),
    };
    const { user, accessToken, refreshToken } = await service.login(req.body, meta);
    res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, { ...cookieBase, maxAge: ACCESS_MAX_AGE });
    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, { ...cookieBase, maxAge: REFRESH_MAX_AGE, path: '/api/auth' });
    res.json({ success: true, data: { user } });
  } catch (err) { next(err); }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawRefreshToken: string | undefined = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];
    if (!rawRefreshToken) { res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'No refresh token' }); return; }
    const meta = {
      ...(req.headers['user-agent'] !== undefined && { userAgent: req.headers['user-agent'] }),
      ...(req.ip !== undefined && { ipAddress: req.ip }),
    };
    const { accessToken, refreshToken } = await service.refresh(rawRefreshToken, meta);
    res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, { ...cookieBase, maxAge: ACCESS_MAX_AGE });
    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, { ...cookieBase, maxAge: REFRESH_MAX_AGE, path: '/api/auth' });
    res.json({ success: true });
  } catch (err) { next(err); }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawRefreshToken: string | undefined = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];
    if (rawRefreshToken) await service.logout(rawRefreshToken);
    res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, { ...cookieBase });
    res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, { ...cookieBase, path: '/api/auth' });
    res.json({ success: true });
  } catch (err) { next(err); }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { const { user } = req as AuthenticatedRequest; res.json({ success: true, data: { user } }); }
  catch (err) { next(err); }
}
EOF

cat > server/src/modules/auth/auth.routes.ts << 'EOF'
import { Router, type Router as ExpressRouter } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { requireAuth } from '../../shared/middlewares/auth.middleware.js';
import { RATE_LIMITS } from '../../shared/constants/index.js';
import { registerSchema, loginSchema } from './auth.schema.js';
import * as controller from './auth.controller.js';

const router: ExpressRouter = Router();
const authLimiter = rateLimit({ ...RATE_LIMITS.AUTH, standardHeaders: true, legacyHeaders: false,
  message: { success: false, code: 'RATE_LIMIT', message: 'Too many attempts, try again later' } });

router.post('/register', authLimiter, validate(registerSchema), controller.register);
router.post('/login', authLimiter, validate(loginSchema), controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);
router.get('/me', requireAuth, controller.me);

export { router as authRoutes };
EOF

# ── Módulos placeholder ───────────────────────────────────────────────────────

for module in users expenses groups balances settlements; do
cat > server/src/modules/$module/${module}.routes.ts << ENDOFFILE
import { Router, type Router as ExpressRouter } from 'express';
import { requireAuth } from '../../shared/middlewares/auth.middleware.js';

const router: ExpressRouter = Router();
router.use(requireAuth);

export { router as ${module}Routes };
ENDOFFILE
done

# ── Entry points ──────────────────────────────────────────────────────────────

cat > server/src/app.ts << 'EOF'
import express, { type Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
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
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true, methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));
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
EOF

cat > server/src/server.ts << 'EOF'
import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './shared/logger/index.js';

const server = app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully`);
  server.close(() => { logger.info('Server closed'); process.exit(0); });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
EOF

echo ""
echo "✓ Estructura creada. Ahora ejecutá:"
echo "  cd server && cp .env.example .env"
echo "  pnpm install"
echo "  # Editá .env con tus secrets reales"
echo "  pnpm dev"