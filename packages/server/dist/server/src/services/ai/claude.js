// packages/server/src/services/ai/claude.ts
// Full replacement — wires the real Anthropic SDK call.
import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env.js';
export class ClaudeProvider {
    client = null;
    getClient() {
        if (!this.client) {
            if (!env.anthropicApiKey) {
                throw new Error('ANTHROPIC_API_KEY is not set.');
            }
            this.client = new Anthropic({ apiKey: env.anthropicApiKey });
        }
        return this.client;
    }
    async complete(request) {
        if (!env.anthropicApiKey) {
            // Dev stub — keeps the server runnable without credentials
            return {
                provider: 'mock',
                model: env.anthropicModel,
                content: '[Claude stub — set ANTHROPIC_API_KEY to enable]',
            };
        }
        const client = this.getClient();
        // Split system message from the rest
        const systemMessage = request.messages.find((m) => m.role === 'system');
        const conversationMessages = request.messages
            .filter((m) => m.role !== 'system')
            .map((m) => ({
            role: m.role,
            content: m.content,
        }));
        const response = await client.messages.create({
            model: env.anthropicModel,
            max_tokens: request.maxTokens ?? 1024,
            temperature: request.temperature ?? 0.7,
            ...(systemMessage ? { system: systemMessage.content } : {}),
            messages: conversationMessages,
        });
        const textBlock = response.content.find((b) => b.type === 'text');
        return {
            provider: 'claude',
            model: response.model,
            content: textBlock?.type === 'text' ? textBlock.text : '',
        };
    }
}
