import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
export const exercisesRouter = router({
    list: publicProcedure.query(() => ({ resource: 'exercises', items: [] })),
    getById: publicProcedure
        .input(z.object({ id: z.string().min(1) }))
        .query(({ input }) => ({ resource: 'exercises', id: input.id, item: null })),
    create: publicProcedure
        .input(z.record(z.unknown()).default({}))
        .mutation(({ input }) => ({ resource: 'exercises', accepted: true, data: input })),
});
