import { QueryClient } from '@tanstack/react-query'
import { HttpError, NetworkError } from '@/lib/http'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: (failureCount, error) =>
          failureCount < 2 &&
          (error instanceof NetworkError ||
            (error instanceof HttpError && error.status >= 500)),
      },
      mutations: { retry: false },
    },
  })
}
