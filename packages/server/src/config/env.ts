import 'dotenv/config';

export interface ServerEnv {
  nodeEnv: string;
  port: number;
  databaseUrl?: string;
  anthropicApiKey?: string;
  anthropicModel: string;
  claudeApiKey?: string;
  claudeModel: string;
  veniceApiKey?: string;
  veniceBaseUrl: string;
  veniceModel: string;
}

export const env: ServerEnv = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? process.env.CLAUDE_API_KEY,
  anthropicModel: process.env.ANTHROPIC_MODEL ?? process.env.CLAUDE_MODEL ?? 'claude-3-5-sonnet-latest',
  claudeApiKey: process.env.ANTHROPIC_API_KEY ?? process.env.CLAUDE_API_KEY,
  claudeModel: process.env.ANTHROPIC_MODEL ?? process.env.CLAUDE_MODEL ?? 'claude-3-5-sonnet-latest',
  veniceApiKey: process.env.VENICE_API_KEY,
  veniceBaseUrl: process.env.VENICE_BASE_URL ?? 'https://api.venice.ai/api/v1',
  veniceModel: process.env.VENICE_MODEL ?? 'llama-3.3-70b',
};
