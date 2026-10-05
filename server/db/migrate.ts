import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './pool.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations(): Promise<void> {
  logger.info('Starting database migrations...');
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    logger.info({ file }, `Running migration: ${file}`);
    const sql = fs.readFileSync(filePath, 'utf-8');

    try {
      if (typeof pool.exec === 'function') {
        await pool.exec(sql);
      } else {
        await pool.query(sql);
      }
      logger.info({ file }, `Migration completed successfully: ${file}`);
    } catch (err) {
      logger.error({ file, err }, `Migration failed: ${file}`);
      throw err;
    }
  }
  logger.info('All migrations completed successfully.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => {
      logger.info('Database migration process exited cleanly.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
