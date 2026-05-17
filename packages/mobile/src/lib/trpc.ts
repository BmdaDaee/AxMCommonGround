import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import superjson from 'superjson';
import * as SecureStore from 'expo-secure-store';
import type { AppRouter } from '../../../server/src/routers';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://cgo.anarchyxmayhem.com';

export const trpc = createTRPCReact<AppRouter>();

export async function createTRPCClient() {
  const token = await SecureStore.getItemAsync('authToken');

  return trpc.createClient({
    transformer: superjson,
    links: [
      httpBatchLink({
        url: `${API_URL}/trpc`,
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
      }),
    ],
  });
}
