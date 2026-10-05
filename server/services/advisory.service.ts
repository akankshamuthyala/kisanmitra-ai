import { withUser } from '../db/withUser.js';
import { pool } from '../db/pool.js';
import { NotFoundError, AppError } from '../middleware/errorHandler.js';
import { checkQuota, logAiUsage } from './quota.service.js';
import { getFarmById } from './farm.service.js';
import { buildSystemPrompt } from '../ai/prompts/system.js';
import { buildAdvisoryPrompt } from '../ai/prompts/advisory.js';
import { advisoryResponseSchema } from '../ai/schemas.gemini.js';
import { generateStructured } from '../ai/generate.js';
import { MODEL } from '../ai/geminiClient.js';
import { advisoryResultSchema } from '../../shared/schemas.js';
import { sniffImage } from '../utils/imageSniff.js';
import type {
  AdvisoryInput,
  ListAdvisoriesQuery,
  RegenerateAdvisoryInput,
} from '../../shared/schemas.js';
import type {
  Advisory,
  AdvisoryResult,
  PaginatedResult,
} from '../../shared/types.js';

export async function createAdvisory(
  userId: string,
  input: AdvisoryInput,
  photoFile?: Express.Multer.File
): Promise<string> {
  // 1. Quota Check
  await checkQuota(userId);

  // 2. Farm Validation & Ownership
  const farm = await getFarmById(userId, input.farm_id);

  // 3. Resolve Crop Name
  let cropName = input.custom_crop_name || 'Crop';
  if (input.crop_id) {
    const cropRes = await pool.query('SELECT name_en FROM crops WHERE id = $1', [input.crop_id]);
    if (cropRes.rows.length > 0) {
      cropName = cropRes.rows[0].name_en;
    }
  }

  // 4. Photo Handling & Validation
  let imagePart: { mimeType: string; dataBase64: string } | undefined;
  if (photoFile) {
    const sniff = sniffImage(photoFile.buffer);
    if (!sniff.isValid || !sniff.mimeType) {
      throw new AppError(sniff.error || 'Invalid photo format', 400, 'INVALID_PHOTO');
    }
    imagePart = {
      mimeType: sniff.mimeType,
      dataBase64: photoFile.buffer.toString('base64'),
    };
  }

  // 5. Insert initial PENDING advisory
  const insertRes = await withUser(userId, async client => {
    const { rows } = await client.query(
      `INSERT INTO advisories (
        user_id, farm_id, crop_id, crop_name, crop_category, variety, growth_stage,
        season, sowing_date, area_acres, recent_weather, focus_areas, symptoms,
        last_fertilizer_applied, last_pesticide_applied, output_language, detail_level,
        has_photo, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 'pending'
      ) RETURNING id`,
      [
        userId,
        farm.id,
        input.crop_id || null,
        cropName,
        input.crop_category,
        input.variety || null,
        input.growth_stage,
        input.season,
        input.sowing_date || null,
        input.area_acres,
        input.recent_weather,
        input.focus_areas,
        input.symptoms || null,
        input.last_fertilizer_applied || null,
        input.last_pesticide_applied || null,
        input.output_language,
        input.detail_level,
        Boolean(photoFile),
      ]
    );
    return rows[0].id as string;
  });

  const advisoryId = insertRes;

  // 6. Build Prompts
  const systemInstruction = buildSystemPrompt(input.output_language, input.detail_level);
  const userText = buildAdvisoryPrompt({
    farm,
    input,
    cropName,
    hasPhoto: Boolean(photoFile),
  });

  // 7. Invoke AI Structured Generation
  try {
    const aiResult = await generateStructured<AdvisoryResult>({
      systemInstruction,
      userText,
      image: imagePart,
      responseSchema: advisoryResponseSchema,
      zod: advisoryResultSchema,
      temperature: 0.3,
    });

    // 8. Update advisory to COMPLETED
    await withUser(userId, async client => {
      await client.query(
        `UPDATE advisories
         SET status = 'completed',
             risk_level = $1,
             title = $2,
             result = $3,
             model_used = $4,
             updated_at = now()
         WHERE id = $5 AND user_id = $6`,
        [
          aiResult.data.risk_level,
          aiResult.data.title,
          JSON.stringify(aiResult.data),
          MODEL,
          advisoryId,
          userId,
        ]
      );
    });

    // Log successful AI usage
    await logAiUsage({
      userId,
      kind: 'advisory',
      model: MODEL,
      promptTokens: aiResult.usage.promptTokens,
      outputTokens: aiResult.usage.outputTokens,
      latencyMs: aiResult.latencyMs,
      success: true,
    });

    return advisoryId;
  } catch (err: any) {
    // 9. Update advisory to FAILED
    const errorMessage = err?.message || 'Failed to generate advisory with AI';
    await withUser(userId, async client => {
      await client.query(
        `UPDATE advisories
         SET status = 'failed',
             error_message = $1,
             updated_at = now()
         WHERE id = $2 AND user_id = $3`,
        [errorMessage, advisoryId, userId]
      );
    });

    await logAiUsage({
      userId,
      kind: 'advisory',
      model: MODEL,
      success: false,
      errorCode: err?.code || 'AI_ERROR',
    });

    throw err;
  }
}

export async function getAdvisoryById(userId: string, advisoryId: string): Promise<Advisory> {
  return withUser(userId, async client => {
    const { rows } = await client.query(
      `SELECT a.*,
              f.name AS farm_name,
              f.state AS farm_state,
              f.district AS farm_district
       FROM advisories a
       JOIN farms f ON a.farm_id = f.id
       WHERE a.id = $1 AND a.user_id = $2`,
      [advisoryId, userId]
    );

    if (rows.length === 0) {
      throw new NotFoundError('Advisory not found');
    }

    const r = rows[0];
    return {
      ...r,
      area_acres: parseFloat(r.area_acres),
    } as Advisory;
  });
}

export async function listAdvisories(
  userId: string,
  query: ListAdvisoriesQuery
): Promise<PaginatedResult<Advisory>> {
  return withUser(userId, async client => {
    const conditions: string[] = ['a.user_id = $1'];
    const values: any[] = [userId];
    let paramIdx = 2;

    if (query.q && query.q.trim().length > 0) {
      conditions.push(`(a.crop_name ILIKE $${paramIdx} OR a.title ILIKE $${paramIdx} OR a.symptoms ILIKE $${paramIdx})`);
      values.push(`%${query.q.trim()}%`);
      paramIdx++;
    }

    if (query.crop && query.crop.trim().length > 0) {
      conditions.push(`a.crop_name ILIKE $${paramIdx++}`);
      values.push(`%${query.crop.trim()}%`);
    }

    if (query.risk) {
      conditions.push(`a.risk_level = $${paramIdx++}`);
      values.push(query.risk);
    }

    if (query.farm_id) {
      conditions.push(`a.farm_id = $${paramIdx++}`);
      values.push(query.farm_id);
    }

    if (query.saved !== undefined) {
      conditions.push(`a.is_saved = $${paramIdx++}`);
      values.push(query.saved);
    }

    const whereClause = conditions.join(' AND ');

    // Count total
    const countRes = await client.query(
      `SELECT COUNT(*)::int AS total FROM advisories a WHERE ${whereClause}`,
      values
    );
    const total = countRes.rows[0]?.total ?? 0;

    const page = query.page || 1;
    const limit = query.limit || 10;
    const offset = (page - 1) * limit;

    const itemsRes = await client.query(
      `SELECT a.*,
              f.name AS farm_name,
              f.state AS farm_state,
              f.district AS farm_district
       FROM advisories a
       JOIN farms f ON a.farm_id = f.id
       WHERE ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
      [...values, limit, offset]
    );

    const items = itemsRes.rows.map((r: any) => ({
      ...r,
      area_acres: parseFloat(r.area_acres),
    })) as Advisory[];

    return {
      items,
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit) || 1,
    };
  });
}

export async function toggleSaveAdvisory(userId: string, advisoryId: string): Promise<boolean> {
  return withUser(userId, async client => {
    const { rows } = await client.query(
      `UPDATE advisories
       SET is_saved = NOT is_saved,
           updated_at = now()
       WHERE id = $1 AND user_id = $2
       RETURNING is_saved`,
      [advisoryId, userId]
    );

    if (rows.length === 0) {
      throw new NotFoundError('Advisory not found');
    }

    return rows[0].is_saved;
  });
}

export async function deleteAdvisory(userId: string, advisoryId: string): Promise<void> {
  return withUser(userId, async client => {
    const res = await client.query(
      'DELETE FROM advisories WHERE id = $1 AND user_id = $2 RETURNING id',
      [advisoryId, userId]
    );

    if (res.rowCount === 0) {
      throw new NotFoundError('Advisory not found');
    }
  });
}

export async function regenerateAdvisory(
  userId: string,
  advisoryId: string,
  input: RegenerateAdvisoryInput
): Promise<Advisory> {
  await checkQuota(userId);

  const existing = await getAdvisoryById(userId, advisoryId);
  const farm = await getFarmById(userId, existing.farm_id);

  const advisoryInput: AdvisoryInput = {
    farm_id: existing.farm_id,
    crop_category: existing.crop_category,
    crop_id: existing.crop_id ?? null,
    custom_crop_name: existing.crop_name,
    variety: existing.variety ?? null,
    growth_stage: existing.growth_stage,
    season: existing.season,
    sowing_date: existing.sowing_date ?? null,
    area_acres: existing.area_acres,
    recent_weather: existing.recent_weather as any,
    focus_areas: existing.focus_areas,
    symptoms: existing.symptoms ?? null,
    last_fertilizer_applied: existing.last_fertilizer_applied ?? null,
    last_pesticide_applied: existing.last_pesticide_applied ?? null,
    output_language: input.output_language,
    detail_level: input.detail_level,
  };

  const systemInstruction = buildSystemPrompt(input.output_language, input.detail_level);
  const userText = buildAdvisoryPrompt({
    farm,
    input: advisoryInput,
    cropName: existing.crop_name,
    hasPhoto: existing.has_photo,
  });

  const aiResult = await generateStructured<AdvisoryResult>({
    systemInstruction,
    userText,
    responseSchema: advisoryResponseSchema,
    zod: advisoryResultSchema,
    temperature: 0.3,
  });

  await withUser(userId, async client => {
    await client.query(
      `UPDATE advisories
       SET output_language = $1,
           detail_level = $2,
           title = $3,
           risk_level = $4,
           result = $5,
           model_used = $6,
           updated_at = now()
       WHERE id = $7 AND user_id = $8`,
      [
        input.output_language,
        input.detail_level,
        aiResult.data.title,
        aiResult.data.risk_level,
        JSON.stringify(aiResult.data),
        MODEL,
        advisoryId,
        userId,
      ]
    );
  });

  await logAiUsage({
    userId,
    kind: 'advisory',
    model: MODEL,
    promptTokens: aiResult.usage.promptTokens,
    outputTokens: aiResult.usage.outputTokens,
    latencyMs: aiResult.latencyMs,
    success: true,
  });

  return getAdvisoryById(userId, advisoryId);
}
