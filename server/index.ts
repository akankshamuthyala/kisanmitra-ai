import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { pool } from './db/pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve client static build in production
const clientDistPath = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  logger.info({ path: clientDistPath }, 'Serving client static assets');
  app.use(express.static(clientDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

const server = app.listen(env.PORT, '0.0.0.0', () => {
  logger.info(
    { port: env.PORT, env: env.NODE_ENV },
    `🌾 KisanMitra AI Server listening on http://0.0.0.0:${env.PORT}`
  );
});

// Graceful Shutdown
const shutdown = async (signal: string) => {
  logger.info({ signal }, 'Graceful shutdown initiated');
  server.close(async () => {
    try {
      await pool.end();
      logger.info('Database pool closed');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error closing database pool');
      process.exit(1);
    }
  });

  // Force exit after 10s if hung
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { server };
