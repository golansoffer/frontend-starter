import { QueryClientProvider } from '@tanstack/react-query'
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'

import { projectQueryOptions } from '@/features/project/project-query'
import { createQueryClient } from '@/lib/query-client'
import { routeTree } from '@/routeTree.gen'

it('composes independent child routes and reuses validated project data', async () => {
  const user = userEvent.setup()
  // jsdom does not implement scrolling.
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        project_name: '  Test project  ',
        project_description: '  Loaded from the API.  ',
        internal_note: 'Must not enter the app model.',
      }),
    ),
  )
  const client = createQueryClient()
  const router = createRouter({
    routeTree,
    context: { queryClient: client },
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  expect(
    await screen.findByRole('heading', { name: 'Test project' }),
  ).toBeVisible()
  expect(screen.getByText('Loaded from the API.')).toBeVisible()
  expect(client.getQueryData(projectQueryOptions.queryKey)).toEqual({
    name: 'Test project',
    description: 'Loaded from the API.',
  })
  expect(screen.getByRole('link', { name: 'Project data' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await user.click(screen.getByRole('link', { name: 'Profile form' }))
  expect(await screen.findByRole('form', { name: 'Profile' })).toBeVisible()
  expect(router.state.location.pathname).toBe('/profile')
  expect(screen.getByRole('link', { name: 'Profile form' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await user.click(screen.getByRole('link', { name: 'Project data' }))
  expect(await screen.findByText('Loaded from the API.')).toBeVisible()
  expect(
    screen.queryByRole('form', { name: 'Profile' }),
  ).not.toBeInTheDocument()
  expect(fetch).toHaveBeenCalledTimes(1)
  client.clear()
})
