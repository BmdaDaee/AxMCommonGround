import express from 'express';
import * as trpcExpress from '@trpc/server/adapters/express';
import { router, createTRPCContext } from './trpc';
import { healthRouter } from './routers/health';
import { authRouter } from './routers/auth';
import { messagesRouter } from './routers/messages';
import { bentlyRouter } from './routers/bently';
import { xpRouter } from './routers/xp';
import { env } from './env';

const app = express();

// Middleware
app.use(express.json());

// tRPC routes
const appRouter = router({
  health: healthRouter,
  auth: authRouter,
  messages: messagesRouter,
  bently: bentlyRouter,
  xp: xpRouter,
});

app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: createTRPCContext,
  })
);

// Health endpoint (non-tRPC)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(env.PORT, () => {
  console.log(`✅ Server running on http://localhost:${env.PORT}`);
});

export type AppRouter = typeof appRouter;
