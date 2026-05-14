import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
import { evaluateRelationalState } from '../engine/relationalEngine.js';


export const pairsRouter = router({
  list: publicProcedure.query(() => ({ resource: 'pairs', items: [] as unknown[] })),
  getById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => ({ resource: 'pairs', id: input.id, item: null as unknown })),
  create: publicProcedure
    .input(z.record(z.unknown()).default({}))
    .mutation(({ input }) => ({ resource: 'pairs', accepted: true, data: input })),

  evaluateState: publicProcedure
    .input(z.object({ availability: z.number(), alignment: z.number(), activation: z.number(), trust: z.number() }))
    .mutation(({ input }) => evaluateRelationalState(input)),
});
