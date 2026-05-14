import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';


export const analyticsRouter = router({
  list: publicProcedure.query(() => ({ resource: 'analytics', items: [] as unknown[] })),
  getById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => ({ resource: 'analytics', id: input.id, item: null as unknown })),
  create: publicProcedure
    .input(z.record(z.unknown()).default({}))
    .mutation(({ input }) => ({ resource: 'analytics', accepted: true, data: input })),
});
