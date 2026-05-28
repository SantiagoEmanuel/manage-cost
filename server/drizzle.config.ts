import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

const url = process.env['DATABASE_URL'];
const authToken = process.env['DATABASE_AUTH_TOKEN'];

if (!url || !authToken) {
  throw new Error(
    'DATABASE_URL y DATABASE_AUTH_TOKEN son obligatorios. Configura el .env apuntando a tu base de Turso antes de generar o aplicar migraciones.',
  );
}

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'turso',
  dbCredentials: {
    url,
    authToken,
  },
});
