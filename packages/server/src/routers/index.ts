import { router } from './trpc';
import { authRouter } from './routers/auth';
import { pairsRouter } from './routers/pairs';
import { messagesRouter } from './routers/messages';
import { bentlyRouter } from './routers/bently';

export const appRouter = router({
  auth: authRouter,
  pairs: pairsRouter,
  messages: messagesRouter,
  bently: bentlyRouter,
});

export type AppRouter = typeof appRouter;
