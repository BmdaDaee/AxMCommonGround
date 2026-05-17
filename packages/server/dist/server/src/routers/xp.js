import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
import { TRPCError } from '@trpc/server';
import { users, xpEvents } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { RANK_XP_REQUIREMENTS } from '../../../shared/constants.js';
export const xpRouter = router({
    addXP: publicProcedure
        .input(z.object({
        amount: z.number().int().positive(),
        source: z.string(),
        pairId: z.string().uuid().optional(),
    }))
        .mutation(async ({ input, ctx }) => {
        if (!ctx.userId) {
            throw new TRPCError({ code: 'UNAUTHORIZED' });
        }
        const db = ctx.db;
        const user = await db.query.users.findFirst({
            where: eq(users.id, ctx.userId),
        });
        if (!user) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
        }
        const newXP = user.xp + input.amount;
        // Determine new rank
        let newRank = user.rank;
        const ranks = Object.entries(RANK_XP_REQUIREMENTS).sort((a, b) => b[1] - a[1]);
        for (const [rank, req] of ranks) {
            if (newXP >= req) {
                newRank = rank;
                break;
            }
        }
        await db.update(users)
            .set({ xp: newXP, rank: newRank })
            .where(eq(users.id, ctx.userId));
        await db.insert(xpEvents).values({
            userId: ctx.userId,
            pairId: input.pairId,
            source: input.source,
            amount: input.amount,
        });
        return { xp: newXP, rank: newRank };
    }),
    getProgress: publicProcedure.query(async ({ ctx }) => {
        if (!ctx.userId) {
            throw new TRPCError({ code: 'UNAUTHORIZED' });
        }
        const db = ctx.db;
        const user = await db.query.users.findFirst({
            where: eq(users.id, ctx.userId),
        });
        if (!user) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
        }
        const ranks = Object.entries(RANK_XP_REQUIREMENTS).sort((a, b) => a[1] - b[1]);
        let nextRank = null;
        let xpToNextRank = 0;
        for (let i = 0; i < ranks.length; i++) {
            if (user.xp < ranks[i][1]) {
                nextRank = ranks[i][0];
                xpToNextRank = ranks[i][1] - user.xp;
                break;
            }
        }
        return {
            currentXp: user.xp,
            currentRank: user.rank,
            nextRank,
            xpToNextRank,
        };
    }),
    getRankLadder: publicProcedure.query(() => {
        return RANK_XP_REQUIREMENTS;
    }),
});
