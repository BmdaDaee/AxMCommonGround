import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';


export const messagesRouter = router({
  list: publicProcedure.query(() => ({ resource: 'messages', items: [] as unknown[] })),
  getById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => ({ resource: 'messages', id: input.id, item: null as unknown })),
  create: publicProcedure
    .input(z.record(z.unknown()).default({}))
    .mutation(({ input }) => ({ resource: 'messages', accepted: true, data: input })),
});
