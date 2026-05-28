import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './shared/logger/index.js';
import { runMigrations } from './db/migrate.js';

async function start(): Promise<void> {
  await runMigrations();

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });

  function shutdown(signal: string): void {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(() => { logger.info('Server closed'); process.exit(0); });
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
