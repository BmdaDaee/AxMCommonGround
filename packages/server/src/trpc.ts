import { initTRPC } from '@trpc/server';
import { randomUUID } from 'node:crypto';
import superjson from 'superjson';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { db } from './db/client.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

export interface Context {
  db: typeof db;
  requestId: string;
  userId?: string;
}

export function createContext({ req }: CreateExpressContextOptions): Context {
  const headerRequestId = req.header('x-request-id');
  const authHeader = req.header('authorization');
  
  let userId: string | undefined;
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    if (token.startsWith('dev-user-')) {
      userId = token.replace('dev-user-', '');
    } else {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        userId = decoded.userId;
      } catch (err) {
        // Invalid token
      }
    }
  }

  return {
    db,
    requestId: headerRequestId ?? randomUUID(),
    userId,
  };
}

const t = initTRPC.context<Context>().create({ transformer: superjson });

export const router = t.router;
export const publicProcedure = t.procedure;
