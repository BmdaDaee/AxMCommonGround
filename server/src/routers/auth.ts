import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';


export const authRouter = router({
  list: publicProcedure.query(() => ({ resource: 'auth', items: [] as unknown[] })),
  getById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => ({ resource: 'auth', id: input.id, item: null as unknown })),
  create: publicProcedure
    .input(z.record(z.unknown()).default({}))
    .mutation(({ input }) => ({ resource: 'auth', accepted: true, data: input })),
});
