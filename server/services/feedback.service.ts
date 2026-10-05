import { withUser } from '../db/withUser.js';
import { getAdvisoryById } from './advisory.service.js';
import type { FeedbackInput } from '../../shared/schemas.js';
import type { Feedback } from '../../shared/types.js';

export async function upsertFeedback(
  userId: string,
  advisoryId: string,
  input: FeedbackInput
): Promise<Feedback> {
  await getAdvisoryById(userId, advisoryId); // verify ownership

  return withUser(userId, async client => {
    const { rows } = await client.query(
      `INSERT INTO feedback (advisory_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (advisory_id, user_id) DO UPDATE
       SET rating = EXCLUDED.rating,
           comment = EXCLUDED.comment,
           created_at = now()
       RETURNING id, advisory_id, user_id, rating, comment, created_at`,
      [advisoryId, userId, input.rating, input.comment || null]
    );

    return rows[0] as Feedback;
  });
}

export async function getFeedback(userId: string, advisoryId: string): Promise<Feedback | null> {
  return withUser(userId, async client => {
    const { rows } = await client.query(
      `SELECT id, advisory_id, user_id, rating, comment, created_at
       FROM feedback
       WHERE advisory_id = $1 AND user_id = $2`,
      [advisoryId, userId]
    );
    return (rows[0] as Feedback) || null;
  });
}
