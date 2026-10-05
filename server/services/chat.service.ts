import { withUser } from '../db/withUser.js';
import { getAdvisoryById } from './advisory.service.js';
import { checkQuota, logAiUsage } from './quota.service.js';
import { buildSystemPrompt } from '../ai/prompts/system.js';
import { buildChatPrompt } from '../ai/prompts/chat.js';
import { chatResponseSchema } from '../ai/schemas.gemini.js';
import { generateStructured } from '../ai/generate.js';
import { MODEL } from '../ai/geminiClient.js';
import { chatReplySchema } from '../../shared/schemas.js';
import type { ChatMessage, ChatReply } from '../../shared/types.js';

export async function getChatHistory(userId: string, advisoryId: string): Promise<ChatMessage[]> {
  await getAdvisoryById(userId, advisoryId); // verifies ownership

  return withUser(userId, async client => {
    const { rows } = await client.query(
      `SELECT id, advisory_id, user_id, role, content, created_at
       FROM chat_messages
       WHERE advisory_id = $1 AND user_id = $2
       ORDER BY created_at ASC`,
      [advisoryId, userId]
    );
    return rows as ChatMessage[];
  });
}

export async function sendChatMessage(
  userId: string,
  advisoryId: string,
  question: string
): Promise<ChatReply> {
  const advisory = await getAdvisoryById(userId, advisoryId);
  await checkQuota(userId);

  // 1. Insert User Message
  await withUser(userId, async client => {
    await client.query(
      `INSERT INTO chat_messages (advisory_id, user_id, role, content)
       VALUES ($1, $2, 'user', $3)`,
      [advisoryId, userId, question]
    );
  });

  // 2. Fetch last 10 messages for context
  const recentMessages = await getChatHistory(userId, advisoryId);

  // 3. Build Prompt & System Instruction
  const systemInstruction = buildSystemPrompt(advisory.output_language, advisory.detail_level);
  const userText = buildChatPrompt({
    advisory,
    recentMessages,
    newQuestion: question,
  });

  // 4. Generate structured reply
  const aiResult = await generateStructured<ChatReply>({
    systemInstruction,
    userText,
    responseSchema: chatResponseSchema,
    zod: chatReplySchema,
    temperature: 0.3,
  });

  // 5. Store Assistant Message
  await withUser(userId, async client => {
    await client.query(
      `INSERT INTO chat_messages (advisory_id, user_id, role, content)
       VALUES ($1, $2, 'assistant', $3)`,
      [advisoryId, userId, aiResult.data.answer]
    );
  });

  // 6. Log AI usage
  await logAiUsage({
    userId,
    kind: 'chat',
    model: MODEL,
    promptTokens: aiResult.usage.promptTokens,
    outputTokens: aiResult.usage.outputTokens,
    latencyMs: aiResult.latencyMs,
    success: true,
  });

  return aiResult.data;
}
