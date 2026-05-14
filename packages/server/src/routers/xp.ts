import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';


export const xpRouter = router({
  list: publicProcedure.query(() => ({ resource: 'xp', items: [] as unknown[] })),
  getById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => ({ resource: 'xp', id: input.id, item: null as unknown })),
  create: publicProcedure
    .input(z.record(z.unknown()).default({}))
    .mutation(({ input }) => ({ resource: 'xp', accepted: true, data: input })),
});
