import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@axmcommonground/server';

export const trpc = createTRPCReact<AppRouter>();
