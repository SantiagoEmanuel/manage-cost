import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required (Turso libsql:// URL)'),
  DATABASE_AUTH_TOKEN: z.string().min(1, 'DATABASE_AUTH_TOKEN is required (Turso auth token)'),
  ACCESS_TOKEN_SECRET: z.string().min(32, 'ACCESS_TOKEN_SECRET must be at least 32 chars'),
  REFRESH_TOKEN_SECRET: z.string().min(32, 'REFRESH_TOKEN_SECRET must be at least 32 chars'),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  /** Comma-separated allowed origins. e.g. "http://localhost:5173,https://gastos.santiagomustafa.com.ar" */
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

/** Parsed list of allowed CORS origins. */
export const corsOrigins: string[] = env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean);

/** Web Push (VAPID) configuration. Optional — the app boots without them. */
export const vapidPublicKey: string = process.env.VAPID_PUBLIC_KEY ?? '';
export const vapidPrivateKey: string = process.env.VAPID_PRIVATE_KEY ?? '';
export const vapidSubject: string = process.env.VAPID_SUBJECT ?? 'mailto:admin@santiagomustafa.com.ar';
