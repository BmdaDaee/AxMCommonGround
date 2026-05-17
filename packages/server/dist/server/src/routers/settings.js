import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
export const settingsRouter = router({
    list: publicProcedure.query(() => ({ resource: 'settings', items: [] })),
    getById: publicProcedure
        .input(z.object({ id: z.string().min(1) }))
        .query(({ input }) => ({ resource: 'settings', id: input.id, item: null })),
    create: publicProcedure
        .input(z.record(z.unknown()).default({}))
        .mutation(({ input }) => ({ resource: 'settings', accepted: true, data: input })),
});
