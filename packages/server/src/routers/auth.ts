import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { hash, verify } from 'argon2';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export const authRouter = router({
  signup: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(8) }))
    .mutation(async ({ input }) => {
      // Check if user exists
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email));

      if (existing.length > 0) {
        throw new Error('User already exists');
      }

      // Hash password
      const hashedPassword = await hash(input.password);

      // Create user
      const result = await db
        .insert(users)
        .values({
          email: input.email,
          passwordHash: hashedPassword,
        })
        .returning({ id: users.id });

      const userId = result[0].id;

      // Generate token
      const token = jwt.sign({ userId, email: input.email }, JWT_SECRET, {
        expiresIn: '30d',
      });

      return { token, userId, email: input.email };
    }),

  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ input }) => {
      // Find user
      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email));

      if (result.length === 0) {
        throw new Error('User not found');
      }

      const user = result[0];

      // Verify password
      const isValid = await verify(user.passwordHash, input.password);
      if (!isValid) {
        throw new Error('Invalid password');
      }

      // Generate token
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: '30d',
      });

      return { token, userId: user.id, email: user.email };
    }),

  verifyToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      try {
        const decoded = jwt.verify(input.token, JWT_SECRET) as { userId: string; email: string };
        return { valid: true, userId: decoded.userId, email: decoded.email };
      } catch {
        return { valid: false };
      }
    }),
});
