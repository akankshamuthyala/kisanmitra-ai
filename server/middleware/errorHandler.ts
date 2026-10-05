import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: unknown;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class QuotaExceededError extends AppError {
  constructor(message = 'Daily AI advisory quota exceeded', details?: unknown) {
    super(message, 429, 'QUOTA_EXCEEDED', details);
  }
}

export class UpstreamAIError extends AppError {
  constructor(message = 'AI analysis service temporarily unavailable, please try again') {
    super(message, 502, 'AI_UPSTREAM_ERROR');
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  // Zod Validation Error
  if (err instanceof ZodError) {
    const details = err.errors.reduce<Record<string, string>>((acc, curr) => {
      const field = curr.path.join('.') || 'root';
      acc[field] = curr.message;
      return acc;
    }, {});

    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details,
      },
    });
    return;
  }

  // AppError (Known operational error)
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, path: req.path }, err.message);
    } else {
      logger.warn({ errCode: err.code, path: req.path }, err.message);
    }

    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // Unknown / Unexpected Error
  logger.error({ err, path: req.path }, 'Unhandled server error');
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected server error occurred',
      ...(env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
    },
  });
}
