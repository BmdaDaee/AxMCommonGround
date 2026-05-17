import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
export const ranksRouter = router({
    list: publicProcedure.query(() => ({ resource: 'ranks', items: [] })),
    getById: publicProcedure
        .input(z.object({ id: z.string().min(1) }))
        .query(({ input }) => ({ resource: 'ranks', id: input.id, item: null })),
    create: publicProcedure
        .input(z.record(z.unknown()).default({}))
        .mutation(({ input }) => ({ resource: 'ranks', accepted: true, data: input })),
});
