import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

const url = process.env['DATABASE_URL'] ?? 'file:./dev.db';
const authToken = process.env['DATABASE_AUTH_TOKEN'];

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'turso',
  dbCredentials: {
    url,
    ...(authToken ? { authToken } : {}),
  },
});
