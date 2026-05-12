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
