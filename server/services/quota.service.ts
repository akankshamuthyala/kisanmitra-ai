import { pool } from '../db/pool.js';
import { QuotaExceededError } from '../middleware/errorHandler.js';

export interface QuotaStatus {
  limit: number;
  usedToday: number;
  remainingToday: number;
  resetsAt: string;
}

export async function checkQuota(userId: string): Promise<QuotaStatus> {
  const userRes = await pool.query('SELECT daily_ai_quota FROM users WHERE id = $1', [userId]);
  const limit = userRes.rows[0]?.daily_ai_quota ?? 20;

  // Count successful usage logs created today (since midnight UTC)
  const usageRes = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM ai_usage_logs
     WHERE user_id = $1
       AND success = true
       AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC')`,
    [userId]
  );

  const usedToday = usageRes.rows[0]?.count ?? 0;
  const remainingToday = Math.max(0, limit - usedToday);

  // Resets at next midnight UTC
  const resetsAtDate = new Date();
  resetsAtDate.setUTCHours(24, 0, 0, 0);
  const resetsAt = resetsAtDate.toISOString();

  if (usedToday >= limit) {
    throw new QuotaExceededError(
      `Daily AI advisory quota of ${limit} requests reached. Your quota will reset at midnight UTC.`,
      { limit, usedToday, resetsAt }
    );
  }

  return { limit, usedToday, remainingToday, resetsAt };
}

export async function logAiUsage(params: {
  userId: string;
  kind: 'advisory' | 'diagnosis' | 'chat';
  model: string;
  promptTokens?: number;
  outputTokens?: number;
  latencyMs?: number;
  success: boolean;
  errorCode?: string;
}): Promise<void> {
  await pool.query(
    `INSERT INTO ai_usage_logs (user_id, kind, model, prompt_tokens, output_tokens, latency_ms, success, error_code)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      params.userId,
      params.kind,
      params.model,
      params.promptTokens || null,
      params.outputTokens || null,
      params.latencyMs || null,
      params.success,
      params.errorCode || null,
    ]
  );
}
