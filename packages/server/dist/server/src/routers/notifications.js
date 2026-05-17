import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
export const notificationsRouter = router({
    list: publicProcedure.query(() => ({ resource: 'notifications', items: [] })),
    getById: publicProcedure
        .input(z.object({ id: z.string().min(1) }))
        .query(({ input }) => ({ resource: 'notifications', id: input.id, item: null })),
    create: publicProcedure
        .input(z.record(z.unknown()).default({}))
        .mutation(({ input }) => ({ resource: 'notifications', accepted: true, data: input })),
});
