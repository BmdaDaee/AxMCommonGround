import { router } from '../trpc.js';
import { authRouter } from './auth.js';
import { pairsRouter } from './pairs.js';
import { messagesRouter } from './messages.js';
import { bentlyRouter } from './bently.js';
import { xpRouter } from './xp.js';
import { astrologyRouter } from './astrology.js';
import { vaultRouter } from './vault.js';

export const appRouter = router({
  auth: authRouter,
  pairs: pairsRouter,
  messages: messagesRouter,
  bently: bentlyRouter,
  xp: xpRouter,
  astrology: astrologyRouter,
  vault: vaultRouter,
});

export type AppRouter = typeof appRouter;
