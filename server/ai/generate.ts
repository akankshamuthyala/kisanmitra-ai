import { ai, MODEL } from './geminiClient.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { deepSanitizeStrings } from '../utils/sanitize.js';
import { UpstreamAIError } from '../middleware/errorHandler.js';

export interface GenerateOptions<T> {
  systemInstruction: string;
  userText: string;
  image?: { mimeType: string; dataBase64: string };
  responseSchema: unknown;
  zod: { parse: (v: unknown) => T };
  temperature?: number;
}

export interface GenerateResult<T> {
  data: T;
  usage: {
    promptTokens?: number;
    outputTokens?: number;
  };
  latencyMs: number;
}

export async function generateStructured<T>(opts: GenerateOptions<T>): Promise<GenerateResult<T>> {
  const parts: any[] = [{ text: opts.userText }];
  if (opts.image) {
    parts.push({
      inlineData: {
        mimeType: opts.image.mimeType,
        data: opts.image.dataBase64,
      },
    });
  }

  const started = Date.now();
  let lastErr: unknown;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      // 30-second timeout controller
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('AI generation request timed out after 30 seconds')), env.GEMINI_TIMEOUT_MS);
      });

      const callPromise = ai.models.generateContent({
        model: MODEL,
        contents: [{ role: 'user', parts }],
        config: {
          systemInstruction: opts.systemInstruction,
          temperature: opts.temperature ?? 0.3,
          responseMimeType: 'application/json',
          responseSchema: opts.responseSchema as any,
        },
      });

      const res = await Promise.race([callPromise, timeoutPromise]);
      const rawText = res.text ?? '';
      
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(rawText);
      } catch (parseErr) {
        logger.warn({ parseErr, rawTextSnippet: rawText.slice(0, 200) }, 'Failed to parse AI JSON output');
        throw new Error('AI output was not valid JSON');
      }

      const validated = opts.zod.parse(parsedJson);
      const sanitized = deepSanitizeStrings(validated);

      return {
        data: sanitized,
        usage: {
          promptTokens: res.usageMetadata?.promptTokenCount,
          outputTokens: res.usageMetadata?.candidatesTokenCount,
        },
        latencyMs: Date.now() - started,
      };
    } catch (e: any) {
      lastErr = e;
      logger.warn(
        { attempt: attempt + 1, errMessage: e?.message, statusCode: e?.status },
        'AI generation attempt failed'
      );

      // Check for non-retryable errors
      if (e?.status === 400 || e?.name === 'ZodError') {
        // Validation failure or malformed schema request - do not retry blindly
        if (attempt === 2) break;
      }

      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt))); // 500ms, 1000ms
      }
    }
  }

  logger.error({ lastErr }, 'All AI generation attempts failed');
  throw new UpstreamAIError(
    lastErr instanceof Error
      ? `AI generation failed: ${lastErr.message}`
      : 'AI advisory service temporarily unavailable'
  );
}
