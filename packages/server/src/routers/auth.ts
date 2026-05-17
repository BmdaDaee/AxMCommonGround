import { z } from 'zod';
import { publicProcedure, router } from '../trpc.js';
import { hash, verify } from 'argon2';
import jwt from 'jsonwebtoken';
import { db as dbClient } from '../db/index.js';
import { users, authAccounts } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const db = dbClient!;

export const authRouter = router({
  signup: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().min(1) }))
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
      const userResult = await db
        .insert(users)
        .values({
          email: input.email,
          name: input.name,
        })
        .returning({ id: users.id });

      const userId = userResult[0].id;

      // Create auth account
      await db.insert(authAccounts).values({
        userId,
        provider: 'password',
        providerAccountId: input.email,
        passwordHash: hashedPassword,
      });

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
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email));

      if (userResult.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult[0];

      // Find auth account
      const authResult = await db
        .select()
        .from(authAccounts)
        .where(eq(authAccounts.userId, user.id));

      if (authResult.length === 0 || !authResult[0].passwordHash) {
        throw new Error('Invalid credentials');
      }

      const authAccount = authResult[0];

      // Verify password
      const isValid = await verify(authAccount.passwordHash!, input.password);
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
