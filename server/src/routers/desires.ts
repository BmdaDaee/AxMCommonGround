import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';


export const desiresRouter = router({
  list: publicProcedure.query(() => ({ resource: 'desires', items: [] as unknown[] })),
  getById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => ({ resource: 'desires', id: input.id, item: null as unknown })),
  create: publicProcedure
    .input(z.record(z.unknown()).default({}))
    .mutation(({ input }) => ({ resource: 'desires', accepted: true, data: input })),
});
