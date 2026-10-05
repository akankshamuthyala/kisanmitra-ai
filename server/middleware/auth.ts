import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { pool } from '../db/pool.js';
import { UnauthorizedError } from './errorHandler.js';
import type { SupportedLanguage } from '../../shared/enums.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  full_name: string;
  preferred_language: SupportedLanguage;
  simple_mode: boolean;
  daily_ai_quota: number;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

interface JwtPayload {
  userId: string;
  email: string;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }

    if (!token) {
      throw new UnauthorizedError('Authentication token missing');
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired authentication session');
    }

    const { rows } = await pool.query(
      `SELECT id, email, full_name, preferred_language, simple_mode, daily_ai_quota
       FROM users
       WHERE id = $1`,
      [decoded.userId]
    );

    if (rows.length === 0) {
      throw new UnauthorizedError('User account not found or removed');
    }

    req.user = rows[0] as AuthenticatedUser;
    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
        const { rows } = await pool.query(
          `SELECT id, email, full_name, preferred_language, simple_mode, daily_ai_quota
           FROM users
           WHERE id = $1`,
          [decoded.userId]
        );
        if (rows.length > 0) {
          req.user = rows[0] as AuthenticatedUser;
        }
      } catch {
        // Silently continue if optional
      }
    }
    next();
  } catch (error) {
    next(error);
  }
}
