import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode, Suspense } from 'react'
import { expect, it, vi } from 'vitest'

import { useTasks } from '@/features/tasks/tasks-query'
import { TasksWidget } from '@/features/tasks/tasks-widget'
import type { TasksWidgetProps } from '@/features/tasks/tasks-widget'

const callbacks = {
  onSearch: vi.fn(),
  onFilterChange: vi.fn(),
  onSortChange: vi.fn(),
}
const props: TasksWidgetProps = {
  ...callbacks,
  search: '',
  filter: 'all',
  sort: 'title',
  tasks: [],
  totalCount: 0,
  openCount: 0,
  completedCount: 0,
}

it('runs the example request and renders adapted tasks', async () => {
  const client = new QueryClient()
  function Example() {
    return <TasksWidget {...useTasks(props)} />
  }
  const { unmount } = render(
    <QueryClientProvider client={client}>
      <Suspense fallback={<p>Loading tasks…</p>}>
        <Example />
      </Suspense>
    </QueryClientProvider>,
  )
  expect(await screen.findByRole('heading', { name: 'Tasks' })).toBeVisible()
  expect(screen.getAllByRole('listitem')).toHaveLength(6)
  expect(screen.getByRole('status')).toHaveTextContent('6 of 6 tasks')
  expect(screen.getByRole('radio', { name: 'Open (4)' })).toBeVisible()
  expect(screen.getByRole('radio', { name: 'Completed (2)' })).toBeVisible()
  unmount()
  client.clear()
})

it('emits named events and renders the values supplied by its owner', async () => {
  const user = userEvent.setup()
  const { rerender } = render(<TasksWidget {...props} />)
  expect(
    screen.getByText('No tasks match your search and status.'),
  ).toBeVisible()
  await user.click(screen.getByRole('radio', { name: 'Open (0)' }))
  expect(callbacks.onFilterChange).toHaveBeenLastCalledWith('open')
  rerender(<TasksWidget {...props} filter="open" sort="title-desc" />)
  expect(screen.getByRole('radio', { name: 'Open (0)' })).toBeChecked()
  await user.click(screen.getByRole('radio', { name: 'Completed (0)' }))
  expect(callbacks.onFilterChange).toHaveBeenLastCalledWith('completed')
  rerender(<TasksWidget {...props} filter="completed" />)
  expect(screen.getByRole('radio', { name: 'Completed (0)' })).toBeChecked()
  await user.click(screen.getByRole('radio', { name: 'All (0)' }))
  expect(callbacks.onFilterChange).toHaveBeenLastCalledWith('all')
  await user.click(screen.getByRole('radio', { name: 'Z to A' }))
  expect(callbacks.onSortChange).toHaveBeenLastCalledWith('title-desc')
  rerender(<TasksWidget {...props} sort="title-desc" />)
  await user.click(screen.getByRole('radio', { name: 'A to Z' }))
  expect(callbacks.onSortChange).toHaveBeenLastCalledWith('title')
})

it('keeps search drafts private, trims submissions, and resets by committed identity', async () => {
  const user = userEvent.setup()
  const { rerender } = render(<TasksWidget {...props} search="review" />)
  const search = screen.getByRole('searchbox', { name: 'Search tasks' })
  await user.clear(search)
  await user.type(search, '  browser  ')
  await user.tab()
  expect(callbacks.onSearch).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Search' }))
  expect(callbacks.onSearch).toHaveBeenCalledWith('browser')
  rerender(<TasksWidget {...props} search="dependencies" />)
  expect(screen.getByRole('searchbox', { name: 'Search tasks' })).toHaveValue(
    'dependencies',
  )
  await user.clear(screen.getByRole('searchbox', { name: 'Search tasks' }))
  await user.type(
    screen.getByRole('searchbox', { name: 'Search tasks' }),
    '{Enter}',
  )
  expect(callbacks.onSearch).toHaveBeenLastCalledWith('')
})

it('shows validation errors and accepts a corrected search', async () => {
  const user = userEvent.setup()
  render(<TasksWidget {...props} />)
  const search = screen.getByRole('searchbox', { name: 'Search tasks' })
  await user.type(search, `${'a'.repeat(101)}{Enter}`)
  expect(await screen.findByText('Use 100 characters or fewer.')).toBeVisible()
  expect(search).toHaveAccessibleDescription('Use 100 characters or fewer.')
  expect(callbacks.onSearch).not.toHaveBeenCalled()
  await user.clear(search)
  await user.type(search, 'review{Enter}')
  expect(callbacks.onSearch).toHaveBeenCalledWith('review')
})

it('reports a failed submission and clears the feedback when editing', async () => {
  const user = userEvent.setup()
  callbacks.onSearch.mockImplementationOnce(() => {
    throw new Error('Search failed')
  })
  render(<TasksWidget {...props} />)
  await user.click(screen.getByRole('button', { name: 'Search' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Search could not finish. Please try again.',
  )
  await user.type(
    screen.getByRole('searchbox', { name: 'Search tasks' }),
    'review',
  )
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

it('keeps keyboard focus when a committed search resets its draft', async () => {
  const user = userEvent.setup()
  const { rerender } = render(
    <StrictMode>
      <TasksWidget {...props} search="review" />
    </StrictMode>,
  )
  const search = screen.getByRole('searchbox', { name: 'Search tasks' })
  await user.clear(search)
  await user.type(search, 'browser{Enter}')
  expect(callbacks.onSearch).toHaveBeenLastCalledWith('browser')
  rerender(
    <StrictMode>
      <TasksWidget {...props} search="browser" />
    </StrictMode>,
  )
  const committedSearch = screen.getByRole('searchbox', {
    name: 'Search tasks',
  })
  expect(committedSearch).not.toBe(search)
  expect(committedSearch).toHaveValue('browser')
  expect(committedSearch).toHaveFocus()
  await user.type(committedSearch, ' draft')
  rerender(
    <StrictMode>
      <TasksWidget {...props} search="review" />
    </StrictMode>,
  )
  expect(screen.getByRole('searchbox', { name: 'Search tasks' })).toHaveValue(
    'review',
  )
  expect(screen.getByRole('searchbox', { name: 'Search tasks' })).toHaveFocus()
})

it('does not take focus when a search commits after button submission', async () => {
  const user = userEvent.setup()
  const { rerender } = render(<TasksWidget {...props} />)
  await user.type(
    screen.getByRole('searchbox', { name: 'Search tasks' }),
    'browser',
  )
  await user.click(screen.getByRole('button', { name: 'Search' }))
  rerender(<TasksWidget {...props} search="browser" />)
  expect(screen.getByRole('searchbox', { name: 'Search tasks' })).toHaveValue(
    'browser',
  )
  expect(
    screen.getByRole('searchbox', { name: 'Search tasks' }),
  ).not.toHaveFocus()
})
