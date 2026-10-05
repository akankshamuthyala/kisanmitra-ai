import { sanitizeUserInput } from '../../utils/sanitize.js';
import type { Advisory, ChatMessage } from '../../../shared/types.js';

export function buildChatPrompt(params: {
  advisory: Advisory;
  recentMessages: ChatMessage[];
  newQuestion: string;
}): string {
  const { advisory, recentMessages, newQuestion } = params;

  const advisoryJson = advisory.result
    ? JSON.stringify(advisory.result).slice(0, 12000)
    : 'No structured advisory content available';

  const compactFacts = `Crop: ${advisory.crop_name} (${advisory.crop_category}), Stage: ${advisory.growth_stage}, Season: ${advisory.season}, Area: ${advisory.area_acres} acres, Weather: ${advisory.recent_weather}`;

  const conversationHistory = recentMessages.slice(-10).map(m => ({
    role: m.role,
    content: m.content,
  }));

  const sanitizedQuestion = sanitizeUserInput(newQuestion, 1000);

  return `Context advisory (JSON, trusted, produced earlier by you):
${advisoryJson}

Farm and crop facts: ${compactFacts}

Recent conversation (last 10 messages): ${JSON.stringify(conversationHistory)}

<user_input>
${sanitizedQuestion}
</user_input>

Answer the farmer's new question using the advisory context. Keep it under 180 words unless detail is requested. If the question needs information not available, say what is needed.`;
}
