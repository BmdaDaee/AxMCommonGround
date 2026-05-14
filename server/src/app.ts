import cors from 'cors';
import express from 'express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './routers/index.js';
import { createContext } from './trpc.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use(
    '/trpc',
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  return app;
}
