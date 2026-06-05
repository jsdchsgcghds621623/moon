import { QueryClient } from '@tanstack/react-query';

/** Browse/catalog data changes infrequently — long stale time cuts repeat work and UI jank. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20 * 60 * 1000,
      gcTime: 45 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: 'always',
    },
  },
});