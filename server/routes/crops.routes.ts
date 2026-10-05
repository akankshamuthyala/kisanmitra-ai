import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as cropService from '../services/crop.service.js';
import type { CropCategory } from '../../shared/enums.js';

const router = Router();

// GET /api/crops
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = req.query.category as CropCategory | undefined;
    const q = req.query.q as string | undefined;

    const crops = await cropService.listCrops({ category, q });
    res.status(200).json({ data: crops });
  } catch (err) {
    next(err);
  }
});

export default router;
