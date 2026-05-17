export * from './types.js';
export * from './claude.js';
export * from './venice.js';
import { ClaudeProvider } from './claude.js';
import { VeniceProvider } from './venice.js';
export function createAiProvider(provider = 'claude') {
    if (provider === 'venice') {
        return new VeniceProvider();
    }
    return new ClaudeProvider();
}
