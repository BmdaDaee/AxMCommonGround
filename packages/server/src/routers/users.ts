import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';


export const usersRouter = router({
  list: publicProcedure.query(() => ({ resource: 'users', items: [] as unknown[] })),
  getById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => ({ resource: 'users', id: input.id, item: null as unknown })),
  create: publicProcedure
    .input(z.record(z.unknown()).default({}))
    .mutation(({ input }) => ({ resource: 'users', accepted: true, data: input })),
});
