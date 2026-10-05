import type { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from './errorHandler.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF Protection Middleware.
 * Enforces custom header (X-Requested-With: XMLHttpRequest or KisanMitraClient)
 * on all state-mutating HTTP requests (POST, PUT, PATCH, DELETE).
 * Browsers cannot send custom headers cross-origin without preflight CORS consent.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // Exempt auth signup and login endpoints from CSRF token requirements as initial entrypoints
  if (req.path === '/api/auth/signup' || req.path === '/api/auth/login') {
    return next();
  }

  const customHeader = req.headers['x-requested-with'] || req.headers['x-csrf-token'];
  if (!customHeader) {
    return next(new ForbiddenError('Missing required security header (X-Requested-With)'));
  }

  next();
}
