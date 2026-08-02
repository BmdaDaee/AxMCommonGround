export interface ImageGenerationRequest {
  prompt: string;
  style?: string; // maps to ART_STYLE (ethereal, bold, classic, fantasy)
  aspectRatio?: '1:1' | '3:4' | '4:3' | '16:9';
}

export interface ImageGenerationResponse {
  provider: 'gemini' | 'mock';
  imageUrl: string;
  promptUsed: string;
}

export interface ImageProvider {
  generate(request: ImageGenerationRequest): Promise<ImageGenerationResponse>;
}
