// packages/mobile/src/lib/trpc.ts
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import * as SecureStore from 'expo-secure-store';
import type { AppRouter } from '../../../server/src/routers/index';

export const trpc = createTRPCReact<AppRouter>();

export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'}/trpc`,
        async headers() {
          const token = await SecureStore.getItemAsync('auth_token');
          return {
            Authorization: token ? `Bearer ${token}` : undefined,
          };
        },
        transformer: superjson as any,
      }),
    ],
  });
}
