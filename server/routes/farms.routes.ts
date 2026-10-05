import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as farmService from '../services/farm.service.js';
import { farmSchema } from '../../shared/schemas.js';

const router = Router();

// GET /api/farms
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const farms = await farmService.listFarms(req.user!.id);
    res.status(200).json({ data: farms });
  } catch (err) {
    next(err);
  }
});

// POST /api/farms
router.post(
  '/',
  requireAuth,
  validate({ body: farmSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const farm = await farmService.createFarm(req.user!.id, req.body);
      res.status(201).json({ data: farm });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/farms/:id
router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const farm = await farmService.getFarmById(req.user!.id, req.params.id!);
    res.status(200).json({ data: farm });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/farms/:id
router.patch(
  '/:id',
  requireAuth,
  validate({ body: farmSchema.partial() }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const farm = await farmService.updateFarm(req.user!.id, req.params.id!, req.body);
      res.status(200).json({ data: farm });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/farms/:id
router.delete('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await farmService.deleteFarm(req.user!.id, req.params.id!);
    res.status(200).json({ data: { message: 'Farm deleted successfully' } });
  } catch (err) {
    next(err);
  }
});

export default router;
