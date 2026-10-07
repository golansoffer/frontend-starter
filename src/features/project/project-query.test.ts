import { QueryClient } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { z } from 'zod'

import { projectQueryOptions } from '@/features/project/project-query'

it.each([
  { project_name: 123, project_description: 'Description' },
  { project_name: '   ', project_description: 'Description' },
  { project_name: 'Project', project_description: '   ' },
])('rejects invalid API data before caching it: %j', async (response) => {
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>().mockResolvedValue(Response.json(response)),
  )
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  await expect(client.query(projectQueryOptions)).rejects.toBeInstanceOf(
    z.ZodError,
  )
  expect(client.getQueryData(projectQueryOptions.queryKey)).toBeUndefined()
  client.clear()
})
