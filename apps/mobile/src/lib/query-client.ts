import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '@/lib/api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20_000,
      gcTime: 10 * 60_000,
      // Retry transient failures once; client errors (validation, auth, not found) are final.
      retry: (failureCount, error) =>
        failureCount < 1 &&
        !(error instanceof ApiError && error.status >= 400 && error.status < 500),
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
