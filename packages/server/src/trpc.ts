import { initTRPC } from '@trpc/server';
import { randomUUID } from 'node:crypto';
import superjson from 'superjson';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { db } from './db/client.js';

export interface Context {
  db: typeof db;
  requestId: string;
  userId?: string;
}

export function createContext({ req }: CreateExpressContextOptions): Context {
  const headerRequestId = req.header('x-request-id');
  const authHeader = req.header('authorization');
  return {
    db,
    requestId: headerRequestId ?? randomUUID(),
    userId: authHeader?.startsWith('Bearer dev-user-') ? authHeader.replace('Bearer dev-user-', '') : undefined,
  };
}

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;
