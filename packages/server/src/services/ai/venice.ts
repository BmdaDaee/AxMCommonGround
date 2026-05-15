// packages/server/src/services/ai/venice.ts
// Full replacement — wires real Venice OpenAI-compatible call.

import { env } from '../../config/env.js';
import type { AiCompletionRequest, AiCompletionResponse, AiProvider } from './types.js';

export class VeniceProvider implements AiProvider {
  async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    if (!env.veniceApiKey) {
      return {
        provider: 'mock',
        model: env.veniceModel,
        content: '[Venice stub — set VENICE_API_KEY to enable]',
      };
    }

    const systemMessage = request.messages.find((m) => m.role === 'system');
    const conversationMessages = request.messages.filter((m) => m.role !== 'system');

    const body = {
      model: env.veniceModel,
      max_tokens: request.maxTokens ?? 1024,
      temperature: request.temperature ?? 0.7,
      messages: [
        ...(systemMessage ? [{ role: 'system', content: systemMessage.content }] : []),
        ...conversationMessages,
      ],
    };

    const response = await fetch(`${env.veniceBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.veniceApiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Venice API error ${response.status}: ${err}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
      model: string;
    };

    return {
      provider: 'venice',
      model: data.model ?? env.veniceModel,
      content: data.choices?.[0]?.message?.content ?? '',
    };
  }
}
