import { ClaudeProvider } from './claude.js';
import { VeniceProvider } from './venice.js';

export const aiProviders = {
  claude: new ClaudeProvider(),
  venice: new VeniceProvider(),
};

export type AiProviderName = keyof typeof aiProviders;
