import { ENV } from "./env";

export type TranscribeOptions = {
  audioUrl: string;
  language?: string;
  prompt?: string;
};

export type WhisperSegment = {
  id: number; seek: number; start: number; end: number; text: string;
  tokens: number[]; temperature: number; avg_logprob: number;
  compression_ratio: number; no_speech_prob: number;
};

export type WhisperResponse = {
  task: "transcribe"; language: string; duration: number; text: string; segments: WhisperSegment[];
};

export type TranscriptionError = {
  error: string;
  code: "FILE_TOO_LARGE" | "INVALID_FORMAT" | "TRANSCRIPTION_FAILED" | "SERVICE_ERROR";
  details?: string;
};

export async function transcribeAudio(options: TranscribeOptions): Promise<WhisperResponse | TranscriptionError> {
  if (!ENV.forgeApiUrl) return { error: "Voice transcription service not configured", code: "SERVICE_ERROR" };
  if (!ENV.forgeApiKey) return { error: "Voice transcription auth missing", code: "SERVICE_ERROR" };

  let audioBuffer: Buffer;
  let mimeType: string;
  try {
    const resp = await fetch(options.audioUrl);
    if (!resp.ok) return { error: "Failed to download audio", code: "INVALID_FORMAT", details: `HTTP ${resp.status}` };
    audioBuffer = Buffer.from(await resp.arrayBuffer());
    mimeType = resp.headers.get("content-type") || "audio/mpeg";
    if (audioBuffer.length / (1024 * 1024) > 16) return { error: "Audio exceeds 16MB limit", code: "FILE_TOO_LARGE" };
  } catch (e) {
    return { error: "Failed to fetch audio", code: "SERVICE_ERROR", details: String(e) };
  }

  const ext: Record<string, string> = { "audio/webm": "webm", "audio/mpeg": "mp3", "audio/wav": "wav", "audio/ogg": "ogg", "audio/mp4": "m4a" };
  const formData = new FormData();
  formData.append("file", new Blob([new Uint8Array(audioBuffer)], { type: mimeType }), `audio.${ext[mimeType] || "audio"}`);
  formData.append("model", "whisper-1");
  formData.append("response_format", "verbose_json");
  formData.append("prompt", options.prompt || "Transcribe the user's voice to text");

  const baseUrl = ENV.forgeApiUrl.endsWith("/") ? ENV.forgeApiUrl : `${ENV.forgeApiUrl}/`;
  const resp = await fetch(new URL("v1/audio/transcriptions", baseUrl).toString(), {
    method: "POST",
    headers: { authorization: `Bearer ${ENV.forgeApiKey}` },
    body: formData,
  });

  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    return { error: "Transcription failed", code: "TRANSCRIPTION_FAILED", details: `${resp.status} ${detail}` };
  }

  const result = await resp.json() as WhisperResponse;
  if (!result.text) return { error: "Invalid transcription response", code: "SERVICE_ERROR" };
  return result;
}
