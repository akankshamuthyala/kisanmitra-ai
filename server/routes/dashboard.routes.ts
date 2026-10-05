import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as dashboardService from '../services/dashboard.service.js';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await dashboardService.getDashboardStats(req.user!.id);
    res.status(200).json({ data: stats });
  } catch (err) {
    next(err);
  }
});

export default router;
