import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import { uploadSingleImage } from '../middleware/upload.js';
import * as advisoryService from '../services/advisory.service.js';
import * as chatService from '../services/chat.service.js';
import * as feedbackService from '../services/feedback.service.js';
import {
  advisoryInputSchema,
  listAdvisoriesQuerySchema,
  regenerateAdvisorySchema,
  chatInputSchema,
  feedbackSchema,
} from '../../shared/schemas.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// POST /api/advisories (Multipart or JSON)
router.post(
  '/',
  requireAuth,
  aiLimiter,
  uploadSingleImage.single('photo'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let rawPayload = req.body.payload ? JSON.parse(req.body.payload) : req.body;
      const parsedInput = await advisoryInputSchema.parseAsync(rawPayload);

      const advisoryId = await advisoryService.createAdvisory(
        req.user!.id,
        parsedInput,
        req.file
      );

      res.status(201).json({ data: { id: advisoryId } });
    } catch (err) {
      if (err instanceof SyntaxError) {
        return next(new AppError('Invalid JSON format in payload field', 400, 'INVALID_PAYLOAD_JSON'));
      }
      next(err);
    }
  }
);

// GET /api/advisories
router.get(
  '/',
  requireAuth,
  validate({ query: listAdvisoriesQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await advisoryService.listAdvisories(req.user!.id, req.query as any);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/advisories/:id
router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const advisory = await advisoryService.getAdvisoryById(req.user!.id, req.params.id!);
    const feedback = await feedbackService.getFeedback(req.user!.id, req.params.id!);
    res.status(200).json({ data: { ...advisory, feedback } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/advisories/:id (Toggle is_saved)
router.patch('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isSaved = await advisoryService.toggleSaveAdvisory(req.user!.id, req.params.id!);
    res.status(200).json({ data: { is_saved: isSaved } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/advisories/:id
router.delete('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await advisoryService.deleteAdvisory(req.user!.id, req.params.id!);
    res.status(200).json({ data: { message: 'Advisory deleted successfully' } });
  } catch (err) {
    next(err);
  }
});

// POST /api/advisories/:id/regenerate
router.post(
  '/:id/regenerate',
  requireAuth,
  aiLimiter,
  validate({ body: regenerateAdvisorySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await advisoryService.regenerateAdvisory(req.user!.id, req.params.id!, req.body);
      res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/advisories/:id/chat
router.get('/:id/chat', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const messages = await chatService.getChatHistory(req.user!.id, req.params.id!);
    res.status(200).json({ data: messages });
  } catch (err) {
    next(err);
  }
});

// POST /api/advisories/:id/chat
router.post(
  '/:id/chat',
  requireAuth,
  aiLimiter,
  validate({ body: chatInputSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reply = await chatService.sendChatMessage(req.user!.id, req.params.id!, req.body.message);
      res.status(200).json({ data: reply });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/advisories/:id/feedback
router.post(
  '/:id/feedback',
  requireAuth,
  validate({ body: feedbackSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const feedback = await feedbackService.upsertFeedback(req.user!.id, req.params.id!, req.body);
      res.status(200).json({ data: feedback });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
