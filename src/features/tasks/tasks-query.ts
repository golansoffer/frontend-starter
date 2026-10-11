import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { requestTasks } from '@/features/tasks/tasks-api'
import type { TasksWidgetProps } from '@/features/tasks/tasks-widget'

const tasksResponseSchema = z
  .array(
    z.object({
      task_id: z.string().trim().min(1).max(64),
      title_text: z.string().trim().min(1).max(120),
      is_done: z.boolean(),
    }),
  )
  .max(100)
  .refine(
    (tasks) => new Set(tasks.map((task) => task.task_id)).size === tasks.length,
    'Task IDs must be unique.',
  )
  .transform((tasks) =>
    tasks.map((task) => ({
      id: task.task_id,
      title: task.title_text,
      completed: task.is_done,
    })),
  )

export const tasksQueryOptions = queryOptions({
  queryKey: ['examples', 'tasks'],
  networkMode: 'always',
  queryFn: async () => tasksResponseSchema.parse(await requestTasks()),
})

type TasksInput = Pick<
  TasksWidgetProps,
  'search' | 'filter' | 'sort' | 'onSearch' | 'onFilterChange' | 'onSortChange'
>

export function useTasks(input: TasksInput): TasksWidgetProps {
  const { data } = useSuspenseQuery(tasksQueryOptions)
  const needle = input.search.toLocaleLowerCase('en')
  const direction = input.sort === 'title' ? 1 : -1
  const tasks = data
    .filter(
      (task) =>
        (input.filter === 'all' ||
          task.completed === (input.filter === 'completed')) &&
        task.title.toLocaleLowerCase('en').includes(needle),
    )
    .toSorted((left, right) => {
      const titleOrder = left.title.localeCompare(right.title, 'en')
      const order =
        titleOrder === 0 ? left.id.localeCompare(right.id, 'en') : titleOrder
      return order * direction
    })
  const completedCount = data.filter((task) => task.completed).length

  return {
    ...input,
    tasks,
    totalCount: data.length,
    openCount: data.length - completedCount,
    completedCount,
  }
}
