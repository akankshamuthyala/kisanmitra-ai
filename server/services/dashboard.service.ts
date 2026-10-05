import { withUser } from '../db/withUser.js';
import { checkQuota } from './quota.service.js';
import type { DashboardStats } from '../../shared/types.js';

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const quota = await checkQuota(userId).catch(err => {
    // If quota exceeded, still return current quota usage info
    return err.details || {
      limit: 20,
      usedToday: 20,
      remainingToday: 0,
      resetsAt: new Date(Date.now() + 86400000).toISOString(),
    };
  });

  return withUser(userId, async client => {
    // 1. Farms count
    const farmsCountRes = await client.query(
      'SELECT COUNT(*)::int AS count FROM farms WHERE user_id = $1',
      [userId]
    );
    const farms_count = farmsCountRes.rows[0]?.count ?? 0;

    // 2. Advisories count & Saved count
    const advCountRes = await client.query(
      `SELECT
         COUNT(*)::int AS total_count,
         COUNT(*) FILTER (WHERE is_saved = true)::int AS saved_count,
         COUNT(*) FILTER (WHERE risk_level = 'low')::int AS risk_low,
         COUNT(*) FILTER (WHERE risk_level = 'moderate')::int AS risk_moderate,
         COUNT(*) FILTER (WHERE risk_level = 'high')::int AS risk_high,
         COUNT(*) FILTER (WHERE risk_level = 'critical')::int AS risk_critical
       FROM advisories
       WHERE user_id = $1`,
      [userId]
    );

    const advRow = advCountRes.rows[0] || {};
    const advisories_count = advRow.total_count ?? 0;
    const saved_count = advRow.saved_count ?? 0;

    // 3. Diagnoses count
    const diagCountRes = await client.query(
      'SELECT COUNT(*)::int AS count FROM diagnoses WHERE user_id = $1',
      [userId]
    );
    const diagnoses_count = diagCountRes.rows[0]?.count ?? 0;

    // 4. Recent advisories (top 5)
    const recentRes = await client.query(
      `SELECT a.id, a.crop_name, a.title, a.risk_level, a.status, a.created_at, f.name AS farm_name
       FROM advisories a
       JOIN farms f ON a.farm_id = f.id
       WHERE a.user_id = $1
       ORDER BY a.created_at DESC
       LIMIT 5`,
      [userId]
    );

    return {
      farms_count,
      advisories_count,
      saved_count,
      diagnoses_count,
      quota_limit: quota.limit,
      quota_used_today: quota.usedToday,
      quota_remaining_today: quota.remainingToday,
      quota_resets_at: quota.resetsAt,
      risk_distribution: {
        low: advRow.risk_low ?? 0,
        moderate: advRow.risk_moderate ?? 0,
        high: advRow.risk_high ?? 0,
        critical: advRow.risk_critical ?? 0,
      },
      recent_advisories: recentRes.rows,
    };
  });
}
