import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';


export const healthRouter = router({
  list: publicProcedure.query(() => ({ resource: 'health', items: [] as unknown[] })),
  getById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => ({ resource: 'health', id: input.id, item: null as unknown })),
  create: publicProcedure
    .input(z.record(z.unknown()).default({}))
    .mutation(({ input }) => ({ resource: 'health', accepted: true, data: input })),

  status: publicProcedure.query(() => ({ status: 'ok' as const, service: 'server', timestamp: new Date().toISOString() })),
});
