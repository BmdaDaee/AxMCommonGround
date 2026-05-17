import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@axmcommonground/server';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://axmcommonground-production.up.railway.app';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${API_URL}/trpc`,
      headers: {
        'Content-Type': 'application/json',
      },
    }),
  ],
});
