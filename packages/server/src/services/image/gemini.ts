// packages/server/src/services/image/gemini.ts
// Gemini/Imagen provider for AI-generated couple portraits & vault scenes.
// Requires GEMINI_API_KEY env var. Not configured yet as of this writing --
// this is the plumbing so the feature is one env var away from working,
// not a working integration yet. Throws a clear error if unconfigured
// rather than failing silently or faking a result.

import type { ImageProvider, ImageGenerationRequest, ImageGenerationResponse } from './types.js';

const STYLE_MODIFIERS: Record<string, string> = {
  ETHEREAL: 'soft lighting, dreamlike, pastel palette, gentle glow',
  BOLD: 'high contrast, saturated color, dramatic composition',
  CLASSIC: 'timeless, painterly, portrait studio lighting',
  FANTASY: 'stylized, illustrative, magical realism',
};

export class GeminiImageProvider implements ImageProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[GeminiImageProvider] GEMINI_API_KEY not set, image generation will fail');
    }
  }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    if (!this.apiKey) {
      throw new Error(
        'GEMINI_API_KEY not configured. Add it to the server env to enable AI-generated portraits and vault scenes.',
      );
    }

    const styleModifier = request.style ? STYLE_MODIFIERS[request.style] ?? '' : '';
    const fullPrompt = [request.prompt, styleModifier].filter(Boolean).join(', ');

    // Imagen 3 via the Gemini API generateImages endpoint.
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: fullPrompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: request.aspectRatio ?? '1:1',
          },
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini image API error: ${response.status} ${error}`);
    }

    const data = (await response.json()) as any;
    const b64 = data?.predictions?.[0]?.bytesBase64Encoded;

    if (!b64) {
      throw new Error('Gemini image API returned no image data');
    }

    // Caller is responsible for uploading this to real storage (Supabase
    // storage bucket) and swapping in the resulting public URL. Returning
    // a data URI here as the immediate, always-correct fallback.
    const imageUrl = `data:image/png;base64,${b64}`;

    return {
      provider: 'gemini',
      imageUrl,
      promptUsed: fullPrompt,
    };
  }
}
