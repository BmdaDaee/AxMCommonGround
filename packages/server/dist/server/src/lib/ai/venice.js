import { env } from '../../config/env.js';
import { AiProviderError } from './types.js';
export class VeniceProvider {
    async complete(request) {
        const model = request.model ?? env.veniceModel;
        if (!env.veniceApiKey) {
            return {
                provider: 'mock',
                model,
                content: `Venice provider mock response. Received ${request.messages.length} message(s).`,
            };
        }
        const response = await fetch(`${env.veniceBaseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                authorization: `Bearer ${env.veniceApiKey}`,
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages: request.messages,
                max_tokens: request.maxTokens ?? 800,
                temperature: request.temperature ?? 0.4,
            }),
        });
        if (!response.ok) {
            throw new AiProviderError(`Venice request failed with status ${response.status}`, 'venice', response.status);
        }
        const data = (await response.json());
        const content = data.choices?.[0]?.message?.content ?? '';
        return {
            provider: 'venice',
            model: data.model ?? model,
            content,
            raw: data,
        };
    }
}
