import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../env';

const client = new Anthropic({ apiKey: env.CLAUDE_API_KEY });

export async function callBentlyAI(options: {
  pairId: string;
  userId: string;
  messageContent: string;
  mode: 'COMMON' | 'DEEPLY_US' | 'SANDBOX' | 'BRIDGE';
}) {
  const systemPrompt = `You are Bently, an AI assistant for couples. You help partners communicate better.
  
  Current mode: ${options.mode}
  - COMMON: General relationship advice
  - SANDBOX: Explore perspectives safely
  - BRIDGE: Mediate between two viewpoints
  
  Be warm, direct, and emotionally intelligent.`;

  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 500,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: options.messageContent,
      },
    ],
  });

  return {
    id: response.id,
    content: (response.content[0] as any).text,
    mode: options.mode,
    confidence: 0.85,
    suggestions: [],
    xpEarned: 20,
    createdAt: new Date(),
  };
}
