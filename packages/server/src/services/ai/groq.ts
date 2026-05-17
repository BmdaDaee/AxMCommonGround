// packages/server/src/services/ai/groq.ts
// Groq provider - free, fast inference

import type { AiProvider, AiResponse } from './types.js';

export class GroqProvider implements AiProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[GroqProvider] GROQ_API_KEY not set, inference will fail');
    }
  }

  async complete(options: {
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    maxTokens?: number;
  }): Promise<AiResponse> {
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 512,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${response.status} ${error}`);
    }

    const data = (await response.json()) as any;
    return {
      content: data.choices[0].message.content,
      provider: 'groq',
      usage: {
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens,
      },
    };
  }
}
