export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiCompletionRequest {
  messages: AiMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface AiCompletionResponse {
  provider: 'groq' | 'claude' | 'venice' | 'mock';
  model: string;
  content: string;
}

export interface AiProvider {
  complete(request: AiCompletionRequest): Promise<AiCompletionResponse>;
}
