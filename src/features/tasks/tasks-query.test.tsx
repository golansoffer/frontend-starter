import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { expect, it, vi } from 'vitest'
import { z } from 'zod'

import { requestTasks } from '@/features/tasks/tasks-api'
import { tasksQueryOptions, useTasks } from '@/features/tasks/tasks-query'

vi.mock('@/features/tasks/tasks-api', () => ({ requestTasks: vi.fn() }))

const wireTasks = [
  { task_id: '2', title_text: 'Beta', is_done: false },
  { task_id: '3', title_text: 'Alpha', is_done: true },
  { task_id: '1', title_text: 'Alpha', is_done: false },
]

it('adapts API data before caching it and keeps derived views out of the cache', async () => {
  vi.mocked(requestTasks).mockResolvedValue(wireTasks)
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity } },
  })
  await client.query(tasksQueryOptions)
  const input: Parameters<typeof useTasks>[0] = {
    search: '',
    filter: 'all',
    sort: 'title',
    onSearch: vi.fn(),
    onFilterChange: vi.fn(),
    onSortChange: vi.fn(),
  }
  type WrapperProps = { children: ReactNode }
  function Wrapper({ children }: WrapperProps) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
  const { result, rerender, unmount } = renderHook(useTasks, {
    initialProps: input,
    wrapper: Wrapper,
  })

  expect(result.current.tasks.map((task) => task.id)).toEqual(['1', '3', '2'])
  expect(result.current).toMatchObject({
    totalCount: 3,
    openCount: 2,
    completedCount: 1,
  })
  expect(result.current.onSearch).toBe(input.onSearch)
  expect(result.current.onFilterChange).toBe(input.onFilterChange)
  expect(result.current.onSortChange).toBe(input.onSortChange)

  rerender({ ...input, sort: 'title-desc' })
  expect(result.current.tasks.map((task) => task.id)).toEqual(['2', '3', '1'])
  rerender({ ...input, filter: 'open' })
  expect(result.current.tasks.map((task) => task.id)).toEqual(['1', '2'])
  rerender({ ...input, filter: 'completed', search: 'ALP' })
  expect(result.current.tasks.map((task) => task.id)).toEqual(['3'])
  rerender({ ...input, search: 'missing' })
  expect(result.current.tasks).toEqual([])

  expect(client.getQueryData(tasksQueryOptions.queryKey)).toEqual([
    { id: '2', title: 'Beta', completed: false },
    { id: '3', title: 'Alpha', completed: true },
    { id: '1', title: 'Alpha', completed: false },
  ])
  expect(client.getQueryCache().getAll()).toHaveLength(1)
  expect(requestTasks).toHaveBeenCalledTimes(1)
  unmount()
  client.clear()
})

it('trims boundary fields and accepts an empty dataset', async () => {
  const client = new QueryClient()
  vi.mocked(requestTasks)
    .mockResolvedValueOnce([
      { task_id: ' 1 ', title_text: ' Task ', is_done: false },
    ])
    .mockResolvedValueOnce([])
  await expect(client.query(tasksQueryOptions)).resolves.toEqual([
    { id: '1', title: 'Task', completed: false },
  ])
  await expect(client.query(tasksQueryOptions)).resolves.toEqual([])
  client.clear()
})

it.each([
  null,
  [{ task_id: '', title_text: 'Task', is_done: false }],
  [{ task_id: '1', title_text: '   ', is_done: false }],
  [{ task_id: '1', title_text: 'Task', is_done: 'false' }],
  [wireTasks[0], wireTasks[0]],
  Array.from({ length: 101 }, (_, index) => ({
    task_id: String(index),
    title_text: 'Task',
    is_done: false,
  })),
])('rejects invalid data before caching it: %j', async (response) => {
  vi.mocked(requestTasks).mockResolvedValue(response)
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  await expect(client.query(tasksQueryOptions)).rejects.toBeInstanceOf(
    z.ZodError,
  )
  expect(client.getQueryData(tasksQueryOptions.queryKey)).toBeUndefined()
  client.clear()
})

it('preserves request failures without fabricating an empty success', async () => {
  const error = new Error('Request failed')
  vi.mocked(requestTasks).mockRejectedValue(error)
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  await expect(client.query(tasksQueryOptions)).rejects.toBe(error)
  expect(client.getQueryData(tasksQueryOptions.queryKey)).toBeUndefined()
  client.clear()
})
