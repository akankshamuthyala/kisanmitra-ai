import { withUser } from '../db/withUser.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import type { FarmInput } from '../../shared/schemas.js';
import type { Farm } from '../../shared/types.js';

export async function listFarms(userId: string): Promise<Farm[]> {
  return withUser(userId, async client => {
    const { rows } = await client.query(
      `SELECT id, user_id, name, state, district, village, total_area_acres, soil_type, irrigation_source, latitude, longitude, created_at, updated_at
       FROM farms
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    return rows.map((r: any) => ({
      ...r,
      total_area_acres: parseFloat(r.total_area_acres),
      latitude: r.latitude ? parseFloat(r.latitude) : null,
      longitude: r.longitude ? parseFloat(r.longitude) : null,
    })) as Farm[];
  });
}

export async function getFarmById(userId: string, farmId: string): Promise<Farm> {
  return withUser(userId, async client => {
    const { rows } = await client.query(
      `SELECT id, user_id, name, state, district, village, total_area_acres, soil_type, irrigation_source, latitude, longitude, created_at, updated_at
       FROM farms
       WHERE id = $1 AND user_id = $2`,
      [farmId, userId]
    );

    if (rows.length === 0) {
      throw new NotFoundError('Farm not found');
    }

    const r = rows[0];
    return {
      ...r,
      total_area_acres: parseFloat(r.total_area_acres),
      latitude: r.latitude ? parseFloat(r.latitude) : null,
      longitude: r.longitude ? parseFloat(r.longitude) : null,
    } as Farm;
  });
}

export async function createFarm(userId: string, input: FarmInput): Promise<Farm> {
  return withUser(userId, async client => {
    const { rows } = await client.query(
      `INSERT INTO farms (user_id, name, state, district, village, total_area_acres, soil_type, irrigation_source, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, user_id, name, state, district, village, total_area_acres, soil_type, irrigation_source, latitude, longitude, created_at, updated_at`,
      [
        userId,
        input.name,
        input.state,
        input.district,
        input.village || null,
        input.total_area_acres,
        input.soil_type,
        input.irrigation_source,
        input.latitude || null,
        input.longitude || null,
      ]
    );

    const r = rows[0];
    return {
      ...r,
      total_area_acres: parseFloat(r.total_area_acres),
      latitude: r.latitude ? parseFloat(r.latitude) : null,
      longitude: r.longitude ? parseFloat(r.longitude) : null,
    } as Farm;
  });
}

export async function updateFarm(userId: string, farmId: string, input: Partial<FarmInput>): Promise<Farm> {
  return withUser(userId, async client => {
    // Check ownership first
    const existing = await client.query('SELECT id FROM farms WHERE id = $1 AND user_id = $2', [farmId, userId]);
    if (existing.rows.length === 0) {
      throw new NotFoundError('Farm not found');
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    if (input.name !== undefined) {
      updates.push(`name = $${paramIdx++}`);
      values.push(input.name);
    }
    if (input.state !== undefined) {
      updates.push(`state = $${paramIdx++}`);
      values.push(input.state);
    }
    if (input.district !== undefined) {
      updates.push(`district = $${paramIdx++}`);
      values.push(input.district);
    }
    if (input.village !== undefined) {
      updates.push(`village = $${paramIdx++}`);
      values.push(input.village || null);
    }
    if (input.total_area_acres !== undefined) {
      updates.push(`total_area_acres = $${paramIdx++}`);
      values.push(input.total_area_acres);
    }
    if (input.soil_type !== undefined) {
      updates.push(`soil_type = $${paramIdx++}`);
      values.push(input.soil_type);
    }
    if (input.irrigation_source !== undefined) {
      updates.push(`irrigation_source = $${paramIdx++}`);
      values.push(input.irrigation_source);
    }
    if (input.latitude !== undefined) {
      updates.push(`latitude = $${paramIdx++}`);
      values.push(input.latitude || null);
    }
    if (input.longitude !== undefined) {
      updates.push(`longitude = $${paramIdx++}`);
      values.push(input.longitude || null);
    }

    if (updates.length === 0) {
      return getFarmById(userId, farmId);
    }

    values.push(farmId, userId);
    const sql = `UPDATE farms
                 SET ${updates.join(', ')}
                 WHERE id = $${paramIdx++} AND user_id = $${paramIdx}
                 RETURNING id, user_id, name, state, district, village, total_area_acres, soil_type, irrigation_source, latitude, longitude, created_at, updated_at`;

    const { rows } = await client.query(sql, values);
    const r = rows[0];
    return {
      ...r,
      total_area_acres: parseFloat(r.total_area_acres),
      latitude: r.latitude ? parseFloat(r.latitude) : null,
      longitude: r.longitude ? parseFloat(r.longitude) : null,
    } as Farm;
  });
}

export async function deleteFarm(userId: string, farmId: string): Promise<void> {
  return withUser(userId, async client => {
    const res = await client.query('DELETE FROM farms WHERE id = $1 AND user_id = $2 RETURNING id', [farmId, userId]);
    if (res.rowCount === 0) {
      throw new NotFoundError('Farm not found');
    }
  });
}
