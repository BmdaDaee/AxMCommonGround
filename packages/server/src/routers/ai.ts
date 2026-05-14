import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
import { createAiProvider } from '../lib/ai/index.js';


export const aiRouter = router({
  list: publicProcedure.query(() => ({ resource: 'ai', items: [] as unknown[] })),
  getById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => ({ resource: 'ai', id: input.id, item: null as unknown })),
  create: publicProcedure
    .input(z.record(z.unknown()).default({}))
    .mutation(({ input }) => ({ resource: 'ai', accepted: true, data: input })),

  complete: publicProcedure
    .input(z.object({ provider: z.enum(['claude', 'venice']).default('claude'), prompt: z.string().min(1) }))
    .mutation(async ({ input }) => createAiProvider(input.provider).complete({ messages: [{ role: 'user', content: input.prompt }] })),
});
