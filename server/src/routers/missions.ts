import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';


export const missionsRouter = router({
  list: publicProcedure.query(() => ({ resource: 'missions', items: [] as unknown[] })),
  getById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => ({ resource: 'missions', id: input.id, item: null as unknown })),
  create: publicProcedure
    .input(z.record(z.unknown()).default({}))
    .mutation(({ input }) => ({ resource: 'missions', accepted: true, data: input })),
});
