// In Next.js, this file would be called: app/providers.tsx
'use client';

import {
  isServer,
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { handleClientSessionExpired } from '@/shared/lib/utils/client-auth.utils';

function isAuthExpiredError(error: any): boolean {
  if (!error) return false;
  const msg = typeof error?.message === "string" ? error.message.toLowerCase() : "";
  return (
    error?.status === 401 ||
    error?.code === "SESSION_EXPIRED" ||
    msg.includes("token has expired") ||
    msg.includes("authorization token") ||
    msg.includes("unauthorized") ||
    msg.includes("expired")
  );
}

function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error: any) => {
        if (isAuthExpiredError(error)) {
          handleClientSessionExpired();
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error: any) => {
        if (isAuthExpiredError(error)) {
          handleClientSessionExpired();
        }
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: (failureCount, error: any) => {
          if (isAuthExpiredError(error)) {
            return false;
          }
          return failureCount < 2;
        },
      },
      mutations: { retry: 0 },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
  }
}

export default function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
