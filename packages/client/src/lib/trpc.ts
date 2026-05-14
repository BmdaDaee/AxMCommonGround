import { createTRPCReact } from '@trpc/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { QueryClient } from '@tanstack/react-query';

/**
 * Type-safe tRPC client for CommonGround API.
 * 
 * Connects to http://localhost:3000/trpc (development)
 * or production endpoint in deployment.
 */

export type AppRouter = any; // Will import from server

export const trpc = createTRPCReact<AppRouter>();

export function getTRPCClient() {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${
          import.meta.env.VITE_TRPC_URL || 'http://localhost:3000'
        }/trpc`,
        credentials: 'include', // Send cookies for auth
      }),
    ],
  });
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});
