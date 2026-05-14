import { drizzle } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';
import { env } from '../env';
import * as schema from '../drizzle/schema';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
