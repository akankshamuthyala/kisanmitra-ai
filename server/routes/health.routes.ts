import { Router } from 'express';
import type { Request, Response } from 'express';
import { pool } from '../db/pool.js';

const router = Router();

// GET /api/health
router.get('/', async (_req: Request, res: Response) => {
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    const dbLatency = Date.now() - start;

    res.status(200).json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        latencyMs: dbLatency,
      },
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'unhealthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: {
        status: 'disconnected',
        error: err?.message || 'Database connection error',
      },
    });
  }
});

export default router;
