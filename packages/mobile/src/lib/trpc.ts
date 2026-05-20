import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import * as SecureStore from 'expo-secure-store';
import type { AppRouter } from '@axmcommonground/server';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://cgo.anarchyxmayhem.com';

export const trpc = createTRPCReact<AppRouter>();

export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${API_URL}/trpc`,
        async headers() {
          const token = await SecureStore.getItemAsync('authToken');
          return {
            ...(token && { Authorization: `Bearer ${token}` }),
            'Content-Type': 'application/json',
          };
        },
      }),
    ],
  });
}
