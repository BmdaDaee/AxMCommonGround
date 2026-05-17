// packages/server/src/services/ai/index.ts
// Groq first (free), then Claude (paid fallback), then Venice (adult content)
import { ClaudeProvider } from './claude.js';
import { VeniceProvider } from './venice.js';
import { GroqProvider } from './groq.js';
export const aiProviders = {
    groq: new GroqProvider(),
    claude: new ClaudeProvider(),
    venice: new VeniceProvider(),
};
// Default to Groq for cost savings
export const DEFAULT_PROVIDER = 'groq';
