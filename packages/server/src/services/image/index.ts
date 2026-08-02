// packages/server/src/services/image/index.ts

import { GeminiImageProvider } from './gemini.js';

export const imageProviders = {
  gemini: new GeminiImageProvider(),
};

export type ImageProviderName = keyof typeof imageProviders;

export const DEFAULT_IMAGE_PROVIDER: ImageProviderName = 'gemini';
