import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';
import { env } from '../config/env.js';
import { AppError, UnauthorizedError } from '../middleware/errorHandler.js';
import type {
  SignupInput,
  LoginInput,
  UpdateProfileInput,
  DeleteAccountInput,
} from '../../shared/schemas.js';
import type { User } from '../../shared/types.js';

interface LoginAttemptTracker {
  attempts: number;
  lockedUntil?: number;
}

const loginAttempts = new Map<string, LoginAttemptTracker>();

function checkLockout(email: string): void {
  const tracker = loginAttempts.get(email);
  if (!tracker) return;

  const now = Date.now();
  if (tracker.lockedUntil && tracker.lockedUntil > now) {
    const minutesLeft = Math.ceil((tracker.lockedUntil - now) / 60000);
    throw new AppError(
      `Account temporarily locked due to excessive failed attempts. Please try again in ${minutesLeft} minute(s).`,
      429,
      'ACCOUNT_LOCKED'
    );
  }
}

function recordFailedAttempt(email: string): void {
  const now = Date.now();
  const tracker = loginAttempts.get(email) || { attempts: 0 };
  tracker.attempts += 1;

  if (tracker.attempts >= 5) {
    tracker.lockedUntil = now + 15 * 60 * 1000; // 15 minute lockout
    tracker.attempts = 0;
  }

  loginAttempts.set(email, tracker);
}

function clearFailedAttempts(email: string): void {
  loginAttempts.delete(email);
}

export function generateToken(user: { id: string; email: string }): string {
  return jwt.sign(
    { userId: user.id, email: user.email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as any }
  );
}

export async function signup(input: SignupInput): Promise<{ user: User; token: string }> {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [input.email]);
  if (existing.rows.length > 0) {
    throw new AppError('An account with this email address already exists', 400, 'EMAIL_EXISTS');
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, preferred_language, simple_mode, daily_ai_quota)
     VALUES ($1, $2, $3, $4, false, $5)
     RETURNING id, email, full_name, preferred_language, simple_mode, daily_ai_quota, created_at, updated_at`,
    [input.email, passwordHash, input.full_name, input.preferred_language, env.DEFAULT_DAILY_AI_QUOTA]
  );

  const user = rows[0] as User;
  const token = generateToken(user);

  return { user, token };
}

export async function login(input: LoginInput): Promise<{ user: User; token: string }> {
  checkLockout(input.email);

  const { rows } = await pool.query(
    `SELECT id, email, password_hash, full_name, preferred_language, simple_mode, daily_ai_quota, created_at, updated_at
     FROM users
     WHERE email = $1`,
    [input.email]
  );

  if (rows.length === 0) {
    recordFailedAttempt(input.email);
    throw new UnauthorizedError('Invalid email or password');
  }

  const rawUser = rows[0];
  const isMatch = await bcrypt.compare(input.password, rawUser.password_hash);
  if (!isMatch) {
    recordFailedAttempt(input.email);
    throw new UnauthorizedError('Invalid email or password');
  }

  clearFailedAttempts(input.email);

  const { password_hash, ...user } = rawUser;
  const token = generateToken(user);

  return { user: user as User, token };
}

export async function getProfile(userId: string): Promise<User> {
  const { rows } = await pool.query(
    `SELECT id, email, full_name, preferred_language, simple_mode, daily_ai_quota, created_at, updated_at
     FROM users
     WHERE id = $1`,
    [userId]
  );

  if (rows.length === 0) {
    throw new UnauthorizedError('User account not found');
  }

  return rows[0] as User;
}

export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<User> {
  const currentUser = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  if (currentUser.rows.length === 0) {
    throw new UnauthorizedError('User account not found');
  }

  // If changing password, verify current password
  let newPasswordHash: string | undefined;
  if (input.new_password) {
    if (!input.current_password) {
      throw new AppError('Current password is required to set a new password', 400, 'PASSWORD_REQUIRED');
    }
    const isCurrentValid = await bcrypt.compare(input.current_password, currentUser.rows[0].password_hash);
    if (!isCurrentValid) {
      throw new AppError('Current password does not match', 400, 'INVALID_PASSWORD');
    }
    newPasswordHash = await bcrypt.hash(input.new_password, 12);
  }

  const updates: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;

  if (input.full_name !== undefined) {
    updates.push(`full_name = $${paramIdx++}`);
    values.push(input.full_name);
  }
  if (input.preferred_language !== undefined) {
    updates.push(`preferred_language = $${paramIdx++}`);
    values.push(input.preferred_language);
  }
  if (input.simple_mode !== undefined) {
    updates.push(`simple_mode = $${paramIdx++}`);
    values.push(input.simple_mode);
  }
  if (newPasswordHash !== undefined) {
    updates.push(`password_hash = $${paramIdx++}`);
    values.push(newPasswordHash);
  }

  if (updates.length === 0) {
    return getProfile(userId);
  }

  values.push(userId);
  const sql = `UPDATE users
               SET ${updates.join(', ')}
               WHERE id = $${paramIdx}
               RETURNING id, email, full_name, preferred_language, simple_mode, daily_ai_quota, created_at, updated_at`;

  const { rows } = await pool.query(sql, values);
  return rows[0] as User;
}

export async function deleteAccount(userId: string, input: DeleteAccountInput): Promise<void> {
  const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  if (rows.length === 0) {
    throw new UnauthorizedError('User account not found');
  }

  const isMatch = await bcrypt.compare(input.password, rows[0].password_hash);
  if (!isMatch) {
    throw new AppError('Incorrect password. Account deletion aborted.', 400, 'INVALID_PASSWORD');
  }

  // Deletion cascades to farms, advisories, chat, diagnoses, feedback, usage logs
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
}

export async function exportUserData(userId: string): Promise<Record<string, unknown>> {
  const user = await getProfile(userId);

  const farms = (await pool.query('SELECT * FROM farms WHERE user_id = $1 ORDER BY created_at DESC', [userId])).rows;
  const advisories = (await pool.query('SELECT * FROM advisories WHERE user_id = $1 ORDER BY created_at DESC', [userId])).rows;
  const diagnoses = (await pool.query('SELECT * FROM diagnoses WHERE user_id = $1 ORDER BY created_at DESC', [userId])).rows;
  const chatMessages = (await pool.query('SELECT * FROM chat_messages WHERE user_id = $1 ORDER BY created_at ASC', [userId])).rows;
  const feedback = (await pool.query('SELECT * FROM feedback WHERE user_id = $1 ORDER BY created_at DESC', [userId])).rows;

  return {
    exported_at: new Date().toISOString(),
    user,
    farms,
    advisories,
    diagnoses,
    chat_messages: chatMessages,
    feedback,
  };
}
