import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';


export const deeplyUsRouter = router({
  list: publicProcedure.query(() => ({ resource: 'deeplyUs', items: [] as unknown[] })),
  getById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => ({ resource: 'deeplyUs', id: input.id, item: null as unknown })),
  create: publicProcedure
    .input(z.record(z.unknown()).default({}))
    .mutation(({ input }) => ({ resource: 'deeplyUs', accepted: true, data: input })),
});
