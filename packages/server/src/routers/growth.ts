import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';


export const growthRouter = router({
  list: publicProcedure.query(() => ({ resource: 'growth', items: [] as unknown[] })),
  getById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => ({ resource: 'growth', id: input.id, item: null as unknown })),
  create: publicProcedure
    .input(z.record(z.unknown()).default({}))
    .mutation(({ input }) => ({ resource: 'growth', accepted: true, data: input })),
});
