import { migrate } from 'drizzle-orm/libsql/migrator';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { db } from './index.js';
import { logger } from '../shared/logger/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Aplica las migraciones pendientes al iniciar el servidor.
 * Garantiza que el esquema exista en entornos locales (file:./dev.db)
 * y en Turso sin requerir un paso manual de `drizzle-kit migrate`.
 */
export async function runMigrations(): Promise<void> {
  const migrationsFolder = resolve(__dirname, 'migrations');
  try {
    await migrate(db, { migrationsFolder });
    logger.info('Database migrations applied');
  } catch (err) {
    logger.error({ err }, 'Failed to apply database migrations');
    throw err;
  }
}
