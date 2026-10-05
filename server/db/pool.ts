import pg from 'pg';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

export interface IDbClient {
  query<R extends pg.QueryResultRow = any, I extends any[] = any[]>(
    queryTextOrConfig: string | pg.QueryConfig<I>,
    values?: I
  ): Promise<pg.QueryResult<R>>;
  exec?(sql: string): Promise<any>;
  release(err?: Error | boolean): void;
}

export interface IDbPool {
  query<R extends pg.QueryResultRow = any, I extends any[] = any[]>(
    queryTextOrConfig: string | pg.QueryConfig<I>,
    values?: I
  ): Promise<pg.QueryResult<R>>;
  exec?(sql: string): Promise<any>;
  connect(): Promise<IDbClient>;
  end(): Promise<void>;
}

let activePool: IDbPool | null = null;

// PGlite adapter for seamless offline/in-memory/embedded local execution
class PGliteAdapter implements IDbPool {
  private pglitePromise: Promise<any>;

  constructor(dataDir?: string) {
    this.pglitePromise = (async () => {
      const { PGlite } = await import('@electric-sql/pglite');
      return new PGlite(dataDir && dataDir !== ':memory:' ? dataDir : undefined);
    })();
  }

  async exec(sql: string): Promise<any> {
    const pglite = await this.pglitePromise;
    return await pglite.exec(sql);
  }

  async query<R extends pg.QueryResultRow = any, I extends any[] = any[]>(
    queryTextOrConfig: string | pg.QueryConfig<I>,
    values?: I
  ): Promise<pg.QueryResult<R>> {
    const pglite = await this.pglitePromise;
    const sql = typeof queryTextOrConfig === 'string' ? queryTextOrConfig : queryTextOrConfig.text;
    const rawParams = typeof queryTextOrConfig === 'string' ? values : (queryTextOrConfig.values as I);

    // Multi-statement script execution
    if ((!rawParams || rawParams.length === 0) && (sql.includes(';\n') || sql.includes('DO $$'))) {
      const res = await pglite.exec(sql);
      const last = Array.isArray(res) ? res[res.length - 1] : res;
      return {
        rows: (last?.rows || []) as R[],
        rowCount: last?.affectedRows ?? 0,
        command: 'EXEC',
        oid: 0,
        fields: [],
      } as pg.QueryResult<R>;
    }

    // Format array parameters if needed
    const params = rawParams?.map(p => {
      if (Array.isArray(p)) {
        return `{${p.map(item => `"${String(item).replace(/"/g, '\\"')}"`).join(',')}}`;
      }
      return p;
    });

    const res = await pglite.query(sql, params);
    return {
      rows: res.rows as R[],
      rowCount: res.affectedRows ?? res.rows.length,
      command: 'SELECT',
      oid: 0,
      fields: res.fields?.map((f: any) => ({ name: f.name, dataTypeID: 0 })) ?? [],
    } as pg.QueryResult<R>;
  }

  async connect(): Promise<IDbClient> {
    const pglite = await this.pglitePromise;
    return {
      query: async (queryTextOrConfig: any, values?: any) => {
        return this.query(queryTextOrConfig, values);
      },
      exec: async (sql: string) => {
        return await pglite.exec(sql);
      },
      release: () => {
        // no-op for embedded pglite
      },
    };
  }

  async end(): Promise<void> {
    const pglite = await this.pglitePromise;
    await pglite.close();
  }
}

export function getPool(): IDbPool {
  if (activePool) {
    return activePool;
  }

  const isPgLite =
    env.DATABASE_URL.startsWith('pglite://') ||
    env.DATABASE_URL.startsWith('memory://') ||
    env.DATABASE_URL === ':memory:';

  if (isPgLite) {
    const path = env.DATABASE_URL.replace(/^pglite:\/\//, '');
    logger.info({ path }, 'Initializing embedded PGlite database adapter');
    activePool = new PGliteAdapter(path);
    return activePool;
  }

  logger.info({ ssl: env.DATABASE_SSL }, 'Initializing PostgreSQL connection pool via pg.Pool');
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: env.DATABASE_SSL ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', err => {
    logger.error({ err }, 'Unexpected error on idle PostgreSQL client');
  });

  activePool = pool;
  return activePool;
}

export const pool = getPool();
