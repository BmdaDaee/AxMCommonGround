import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';


export const boundariesRouter = router({
  list: publicProcedure.query(() => ({ resource: 'boundaries', items: [] as unknown[] })),
  getById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => ({ resource: 'boundaries', id: input.id, item: null as unknown })),
  create: publicProcedure
    .input(z.record(z.unknown()).default({}))
    .mutation(({ input }) => ({ resource: 'boundaries', accepted: true, data: input })),
});
