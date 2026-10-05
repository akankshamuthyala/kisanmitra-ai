import { pool } from '../db/pool.js';
import type { Crop } from '../../shared/types.js';
import type { CropCategory } from '../../shared/enums.js';

export async function listCrops(opts: { category?: CropCategory; q?: string }): Promise<Crop[]> {
  const conditions: string[] = ['is_active = true'];
  const values: any[] = [];
  let paramIdx = 1;

  if (opts.category) {
    conditions.push(`category = $${paramIdx++}`);
    values.push(opts.category);
  }

  if (opts.q && opts.q.trim().length > 0) {
    conditions.push(`(name_en ILIKE $${paramIdx} OR names_i18n::text ILIKE $${paramIdx})`);
    values.push(`%${opts.q.trim()}%`);
    paramIdx++;
  }

  const sql = `SELECT id, category, name_en, names_i18n, typical_seasons, is_active
               FROM crops
               WHERE ${conditions.join(' AND ')}
               ORDER BY category ASC, name_en ASC`;

  const { rows } = await pool.query(sql, values);
  return rows as Crop[];
}
