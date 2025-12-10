import { QueryClient } from '@tanstack/react-query';

/**
 * React Query client configuration
 * Provides caching, background updates, and automatic refetching
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Cache data for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Keep cached data for 30 minutes
            gcTime: 30 * 60 * 1000,
            // Retry failed requests 3 times with exponential backoff
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Refetch on window focus
            refetchOnWindowFocus: true,
            // Don't refetch on mount if data is fresh
            refetchOnMount: false,
        },
        mutations: {
            // Retry mutations once on failure
            retry: 1,
        },
    },
});

export default queryClient;
