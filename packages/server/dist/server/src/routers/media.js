import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
export const mediaRouter = router({
    list: publicProcedure.query(() => ({ resource: 'media', items: [] })),
    getById: publicProcedure
        .input(z.object({ id: z.string().min(1) }))
        .query(({ input }) => ({ resource: 'media', id: input.id, item: null })),
    create: publicProcedure
        .input(z.record(z.unknown()).default({}))
        .mutation(({ input }) => ({ resource: 'media', accepted: true, data: input })),
});
