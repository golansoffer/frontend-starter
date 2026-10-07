import type { QueryClient } from '@tanstack/react-query'
import {
  Link,
  Outlet,
  createRootRouteWithContext,
} from '@tanstack/react-router'

import { env } from '@/lib/env'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: RootLayout,
  },
)

function RootLayout() {
  return (
    <>
      <a
        href="#main-content"
        tabIndex={0}
        className="sr-only focus:not-sr-only"
      >
        Skip to content
      </a>
      <header className="border-b">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4"
        >
          <Link to="/" className="font-medium">
            {env.VITE_APP_NAME}
          </Link>
          <Link to="/about" className="text-sm underline underline-offset-4">
            About
          </Link>
        </nav>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-2xl px-6 py-10"
      >
        <Outlet />
      </main>
    </>
  )
}
