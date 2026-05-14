import { env } from '../../config/env.js';
import type { AiCompletionRequest, AiCompletionResponse, AiProvider } from './types.js';

export class VeniceProvider implements AiProvider {
  async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    if (!env.veniceApiKey) {
      return {
        provider: 'mock',
        model: env.veniceModel,
        content: `Venice provider is configured as a safe stub. Prompt messages: ${request.messages.length}.`,
      };
    }

    return {
      provider: 'venice',
      model: env.veniceModel,
      content: 'Venice integration placeholder: wire Venice chat completion call here when credentials and network policy are finalized.',
    };
  }
}
