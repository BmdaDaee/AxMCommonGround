import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
export const calendarRouter = router({
    list: publicProcedure.query(() => ({ resource: 'calendar', items: [] })),
    getById: publicProcedure
        .input(z.object({ id: z.string().min(1) }))
        .query(({ input }) => ({ resource: 'calendar', id: input.id, item: null })),
    create: publicProcedure
        .input(z.record(z.unknown()).default({}))
        .mutation(({ input }) => ({ resource: 'calendar', accepted: true, data: input })),
});
