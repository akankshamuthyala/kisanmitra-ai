import { withUser } from '../db/withUser.js';
import { checkQuota, logAiUsage } from './quota.service.js';
import { sniffImage } from '../utils/imageSniff.js';
import { AppError } from '../middleware/errorHandler.js';
import { buildSystemPrompt } from '../ai/prompts/system.js';
import { buildDiagnosisPrompt } from '../ai/prompts/diagnosis.js';
import { diagnosisResponseSchema } from '../ai/schemas.gemini.js';
import { generateStructured } from '../ai/generate.js';
import { MODEL } from '../ai/geminiClient.js';
import { diagnosisResultSchema } from '../../shared/schemas.js';
import type { DiagnoseInput } from '../../shared/schemas.js';
import type { DiagnosisRecord, DiagnosisResult } from '../../shared/types.js';

export async function diagnosePhoto(
  userId: string,
  input: DiagnoseInput,
  file: Express.Multer.File
): Promise<DiagnosisRecord> {
  // 1. Quota Check
  await checkQuota(userId);

  // 2. Validate image & sniff magic bytes
  const sniff = sniffImage(file.buffer);
  if (!sniff.isValid || !sniff.mimeType) {
    throw new AppError(sniff.error || 'Invalid photo format', 400, 'INVALID_IMAGE');
  }

  // 3. Prepare multimodal input
  const imagePart = {
    mimeType: sniff.mimeType,
    dataBase64: file.buffer.toString('base64'),
  };

  const systemInstruction = buildSystemPrompt(input.output_language, 'detailed');
  const userText = buildDiagnosisPrompt({
    cropHint: input.crop_hint,
    notes: input.notes,
  });

  // 4. Generate structured diagnosis
  const aiResult = await generateStructured<DiagnosisResult>({
    systemInstruction,
    userText,
    image: imagePart,
    responseSchema: diagnosisResponseSchema,
    zod: diagnosisResultSchema,
    temperature: 0.2,
  });

  // 5. Store diagnosis record in DB
  const record = await withUser(userId, async client => {
    const { rows } = await client.query(
      `INSERT INTO diagnoses (
        user_id, crop_hint, notes, output_language, image_mime, image_sha256, result, model_used
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, user_id, crop_hint, notes, output_language, image_mime, image_sha256, result, model_used, created_at`,
      [
        userId,
        input.crop_hint || null,
        input.notes || null,
        input.output_language,
        sniff.mimeType,
        sniff.sha256,
        JSON.stringify(aiResult.data),
        MODEL,
      ]
    );
    return rows[0] as DiagnosisRecord;
  });

  // 6. Log AI usage
  await logAiUsage({
    userId,
    kind: 'diagnosis',
    model: MODEL,
    promptTokens: aiResult.usage.promptTokens,
    outputTokens: aiResult.usage.outputTokens,
    latencyMs: aiResult.latencyMs,
    success: true,
  });

  return record;
}

export async function listRecentDiagnoses(userId: string, limit = 10): Promise<DiagnosisRecord[]> {
  return withUser(userId, async client => {
    const { rows } = await client.query(
      `SELECT id, user_id, crop_hint, notes, output_language, image_mime, image_sha256, result, model_used, created_at
       FROM diagnoses
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return rows as DiagnosisRecord[];
  });
}
