import { pool, type IDbClient } from './pool.js';
import { logger } from '../utils/logger.js';

/**
 * Executes a database operation within a transaction scoped to a specific user.
 * Sets the PostgreSQL session variable 'app.current_user_id' so that Row-Level Security (RLS)
 * policies can isolate rows belonging only to the authenticated user.
 */
export async function withUser<T>(
  userId: string,
  callback: (client: IDbClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_user_id', $1, true)", [userId]);
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      logger.error({ rollbackErr }, 'Failed to rollback transaction');
    }
    throw error;
  } finally {
    client.release();
  }
}
