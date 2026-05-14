import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';


export const voiceRouter = router({
  list: publicProcedure.query(() => ({ resource: 'voice', items: [] as unknown[] })),
  getById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => ({ resource: 'voice', id: input.id, item: null as unknown })),
  create: publicProcedure
    .input(z.record(z.unknown()).default({}))
    .mutation(({ input }) => ({ resource: 'voice', accepted: true, data: input })),
});
