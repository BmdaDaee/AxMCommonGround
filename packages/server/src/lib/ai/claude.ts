import { env } from '../../config/env.js';
import type { AiCompletionRequest, AiCompletionResponse, AiProvider, AiMessage } from './types.js';
import { AiProviderError } from './types.js';

interface AnthropicContentBlock {
  type: string;
  text?: string;
}

interface AnthropicMessageResponse {
  content?: AnthropicContentBlock[];
  model?: string;
}

function splitSystemPrompt(messages: AiMessage[]): { system?: string; messages: Array<{ role: 'user' | 'assistant'; content: string }> } {
  const systemMessages = messages.filter((message) => message.role === 'system').map((message) => message.content);
  const conversationalMessages = messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({ role: message.role as 'user' | 'assistant', content: message.content }));

  return {
    system: systemMessages.length > 0 ? systemMessages.join('\n\n') : undefined,
    messages: conversationalMessages.length > 0 ? conversationalMessages : [{ role: 'user', content: 'Respond with a concise CommonGround coaching insight.' }],
  };
}

export class ClaudeProvider implements AiProvider {
  async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    const model = request.model ?? env.anthropicModel;

    if (!env.anthropicApiKey) {
      return {
        provider: 'mock',
        model,
        content: `Claude provider mock response. Received ${request.messages.length} message(s).`,
      };
    }

    const payload = splitSystemPrompt(request.messages);
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: request.maxTokens ?? 800,
        temperature: request.temperature ?? 0.4,
        system: payload.system,
        messages: payload.messages,
      }),
    });

    if (!response.ok) {
      throw new AiProviderError(`Claude request failed with status ${response.status}`, 'claude', response.status);
    }

    const data = (await response.json()) as AnthropicMessageResponse;
    const content = data.content?.map((block) => block.text ?? '').join('').trim() ?? '';

    return {
      provider: 'claude',
      model: data.model ?? model,
      content,
      raw: data,
    };
  }
}
