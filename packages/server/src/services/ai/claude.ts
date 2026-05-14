import { env } from '../../config/env.js';
import type { AiCompletionRequest, AiCompletionResponse, AiProvider } from './types.js';

export class ClaudeProvider implements AiProvider {
  async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    if (!env.claudeApiKey) {
      return {
        provider: 'mock',
        model: env.claudeModel,
        content: `Claude provider is configured as a safe stub. Prompt messages: ${request.messages.length}.`,
      };
    }

    return {
      provider: 'claude',
      model: env.claudeModel,
      content: 'Claude integration placeholder: wire Anthropic SDK call here when credentials and network policy are finalized.',
    };
  }
}
