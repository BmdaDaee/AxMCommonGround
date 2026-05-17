// packages/server/src/services/ai/groq.ts
// Groq provider - free, fast inference (llama-3.3-70b-versatile)
export class GroqProvider {
    apiKey;
    constructor() {
        this.apiKey = process.env.GROQ_API_KEY || '';
        if (!this.apiKey) {
            console.warn('[GroqProvider] GROQ_API_KEY not set, inference will fail');
        }
    }
    async complete(options) {
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
                model: 'llama-3.3-70b-versatile',
                messages: options.messages,
                temperature: options.temperature ?? 0.7,
                max_tokens: options.maxTokens ?? 512,
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Groq API error: ${response.status} ${error}`);
        }
        const data = (await response.json());
        return {
            content: data.choices[0].message.content,
            provider: 'groq',
            model: 'llama-3.3-70b-versatile',
        };
    }
}
