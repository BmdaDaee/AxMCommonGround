import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { env } from '../config/env.js';
import * as schema from './schema.js';
const { Pool } = pg;
export const pool = env.databaseUrl
    ? new Pool({ connectionString: env.databaseUrl })
    : undefined;
export const db = pool ? drizzle(pool, { schema }) : undefined;
