import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';


export const journalRouter = router({
  list: publicProcedure.query(() => ({ resource: 'journal', items: [] as unknown[] })),
  getById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => ({ resource: 'journal', id: input.id, item: null as unknown })),
  create: publicProcedure
    .input(z.record(z.unknown()).default({}))
    .mutation(({ input }) => ({ resource: 'journal', accepted: true, data: input })),
});
