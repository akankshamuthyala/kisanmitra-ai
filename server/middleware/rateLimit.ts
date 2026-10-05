import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again in a minute',
    },
  },
});

export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 attempts per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again shortly',
    },
  },
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 AI requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    return req.user?.id || req.ip || 'anonymous';
  },
  handler: (req: Request, res: Response): void => {
    res.status(429).json({
      error: {
        code: 'AI_RATE_LIMIT_EXCEEDED',
        message: 'AI request limit reached (5 requests/minute). Please wait before requesting another advisory.',
      },
    });
  },
});
