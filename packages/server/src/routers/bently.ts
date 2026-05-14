import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
import { aiProviders } from '../services/ai/index.js';


export const bentlyRouter = router({
  list: publicProcedure.query(() => ({ resource: 'bently', items: [] as unknown[] })),
  getById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => ({ resource: 'bently', id: input.id, item: null as unknown })),
  create: publicProcedure
    .input(z.record(z.unknown()).default({}))
    .mutation(({ input }) => ({ resource: 'bently', accepted: true, data: input })),

  coach: publicProcedure
    .input(z.object({ message: z.string().min(1), provider: z.enum(['claude', 'venice']).default('claude') }))
    .mutation(async ({ input }) => aiProviders[input.provider].complete({
      messages: [
        { role: 'system', content: 'You are Bently, a relational communication coach.' },
        { role: 'user', content: input.message },
      ],
    })),
});
