export * from './types.js';
export * from './claude.js';
export * from './venice.js';

import type { AiProvider } from './types.js';
import { ClaudeProvider } from './claude.js';
import { VeniceProvider } from './venice.js';

export type AiProviderName = 'claude' | 'venice';

export function createAiProvider(provider: AiProviderName = 'claude'): AiProvider {
  if (provider === 'venice') {
    return new VeniceProvider();
  }

  return new ClaudeProvider();
}
