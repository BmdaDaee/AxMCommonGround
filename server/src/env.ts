import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string(),
  CLAUDE_API_KEY: z.string(),
  VENICE_API_KEY: z.string(),
  FORGE_API_KEY: z.string(),
  FORGE_API_URL: z.string(),
  OAUTH_SERVER_URL: z.string(),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  AWS_S3_BUCKET: z.string(),
});

export const env = envSchema.parse(process.env);
