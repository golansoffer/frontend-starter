import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { useState } from 'react'
import type { z } from 'zod'

import { tasksQueryOptions, useTasks } from '@/features/tasks/tasks-query'
import { TasksWidget } from '@/features/tasks/tasks-widget'
import { tasksSearchSchema } from '@/routes/_examples/tasks/-search'

export const Route = createFileRoute('/_examples/tasks')({
  validateSearch: tasksSearchSchema,
  search: { middlewares: [stripSearchParams(tasksSearchSchema.parse({}))] },
  loader: ({ context }) => context.queryClient.query(tasksQueryOptions),
  component: TasksRoute,
})

type TasksSearch = z.infer<typeof tasksSearchSchema>

function TasksRoute() {
  const title = '2. URL-owned task list'
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const [navigationFailed, setNavigationFailed] = useState(false)

  function changeSearch(update: (previous: TasksSearch) => TasksSearch) {
    setNavigationFailed(false)
    navigate({ search: update }).catch(() => {
      setNavigationFailed(true)
    })
  }

  const props = useTasks({
    ...search,
    onSearch: (value) => {
      changeSearch((previous) => ({ ...previous, search: value }))
    },
    onFilterChange: (filter) => {
      changeSearch((previous) => ({ ...previous, filter }))
    },
    onSortChange: (sort) => {
      changeSearch((previous) => ({ ...previous, sort }))
    },
  })

  return (
    <article className="space-y-6">
      <title>{title}</title>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">
        Search, filter, or sort, then share the URL or use Back and Forward.
      </p>
      {navigationFailed && (
        <p role="alert">The URL could not be updated. Please try again.</p>
      )}
      <TasksWidget {...props} />
    </article>
  )
}
