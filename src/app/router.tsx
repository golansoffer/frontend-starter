import { Link, createRouter } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { createQueryClient } from '@/lib/query-client'
import { routeTree } from '@/routeTree.gen'

export const queryClient = createQueryClient()

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
  search: { strict: true },
  defaultPendingComponent: () => <output>Loading…</output>,
  defaultErrorComponent: () => (
    <div role="alert" className="space-y-4">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p>We could not load this page. Please try again.</p>
      <Button
        onClick={() => {
          window.location.reload()
        }}
      >
        Reload page
      </Button>
    </div>
  ),
  defaultNotFoundComponent: () => (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link to="/" className="underline underline-offset-4">
        Back to home
      </Link>
    </div>
  ),
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
