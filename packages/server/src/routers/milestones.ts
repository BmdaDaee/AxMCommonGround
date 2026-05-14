import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';


export const milestonesRouter = router({
  list: publicProcedure.query(() => ({ resource: 'milestones', items: [] as unknown[] })),
  getById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => ({ resource: 'milestones', id: input.id, item: null as unknown })),
  create: publicProcedure
    .input(z.record(z.unknown()).default({}))
    .mutation(({ input }) => ({ resource: 'milestones', accepted: true, data: input })),
});
