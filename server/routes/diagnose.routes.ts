import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import { uploadSingleImage } from '../middleware/upload.js';
import * as diagnosisService from '../services/diagnosis.service.js';
import { diagnoseInputSchema } from '../../shared/schemas.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// POST /api/diagnose (Multipart: image + fields)
router.post(
  '/',
  requireAuth,
  aiLimiter,
  uploadSingleImage.single('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError('An image file is required for photo diagnosis', 400, 'IMAGE_REQUIRED');
      }

      const parsedInput = await diagnoseInputSchema.parseAsync({
        crop_hint: req.body.crop_hint,
        notes: req.body.notes,
        output_language: req.body.output_language || 'en',
      });

      const diagnosis = await diagnosisService.diagnosePhoto(
        req.user!.id,
        parsedInput,
        req.file
      );

      res.status(201).json({ data: diagnosis });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/diagnoses
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const diagnoses = await diagnosisService.listRecentDiagnoses(req.user!.id);
    res.status(200).json({ data: diagnoses });
  } catch (err) {
    next(err);
  }
});

export default router;
