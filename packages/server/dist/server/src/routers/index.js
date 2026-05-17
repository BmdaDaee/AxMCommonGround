import { router } from '../trpc.js';
import { authRouter } from './auth.js';
import { pairsRouter } from './pairs.js';
import { messagesRouter } from './messages.js';
export const appRouter = router({
    auth: authRouter,
    pairs: pairsRouter,
    messages: messagesRouter,
    // bently and xp routers disabled for now
});
