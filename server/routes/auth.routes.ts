import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { env } from '../config/env.js';
import {
  signupSchema,
  loginSchema,
  updateProfileSchema,
  deleteAccountSchema,
} from '../../shared/schemas.js';

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

// POST /api/auth/signup
router.post(
  '/signup',
  validate({ body: signupSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user, token } = await authService.signup(req.body);
      res.cookie('token', token, COOKIE_OPTIONS);
      res.status(201).json({
        data: {
          user,
          token, // also return token for mobile or non-cookie clients
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  validate({ body: loginSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user, token } = await authService.login(req.body);
      res.cookie('token', token, COOKIE_OPTIONS);
      res.status(200).json({
        data: {
          user,
          token,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/logout
router.post('/logout', requireAuth, (req: Request, res: Response) => {
  res.clearCookie('token', { path: '/' });
  res.status(200).json({
    data: { message: 'Logged out successfully' },
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getProfile(req.user!.id);
    res.status(200).json({ data: { user } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/auth/me
router.patch(
  '/me',
  requireAuth,
  validate({ body: updateProfileSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authService.updateProfile(req.user!.id, req.body);
      res.status(200).json({ data: { user } });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/auth/me
router.delete(
  '/me',
  requireAuth,
  validate({ body: deleteAccountSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.deleteAccount(req.user!.id, req.body);
      res.clearCookie('token', { path: '/' });
      res.status(200).json({ data: { message: 'Account permanently deleted' } });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/auth/me/export
router.get('/me/export', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const exportData = await authService.exportUserData(req.user!.id);
    res.setHeader('Content-Disposition', `attachment; filename="kisanmitra-data-${req.user!.id}.json"`);
    res.status(200).json({ data: exportData });
  } catch (err) {
    next(err);
  }
});

export default router;
