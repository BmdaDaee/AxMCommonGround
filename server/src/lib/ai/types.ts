export type AiRole = 'system' | 'user' | 'assistant';

export interface AiMessage {
  role: AiRole;
  content: string;
}

export interface AiCompletionRequest {
  messages: AiMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface AiCompletionResponse {
  provider: 'claude' | 'venice' | 'mock';
  model: string;
  content: string;
  raw?: unknown;
}

export interface AiProvider {
  complete(request: AiCompletionRequest): Promise<AiCompletionResponse>;
}

export class AiProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: 'claude' | 'venice',
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'AiProviderError';
  }
}
