import { TasksSearch } from '@/features/tasks/tasks-search'

export type TasksWidgetProps = {
  search: string
  filter: 'all' | 'open' | 'completed'
  sort: 'title' | 'title-desc'
  tasks: readonly { id: string; title: string; completed: boolean }[]
  totalCount: number
  openCount: number
  completedCount: number
  onSearch: (search: string) => void
  onFilterChange: (filter: TasksWidgetProps['filter']) => void
  onSortChange: (sort: TasksWidgetProps['sort']) => void
}

export function TasksWidget({
  search,
  filter,
  sort,
  tasks,
  totalCount,
  openCount,
  completedCount,
  onSearch,
  onFilterChange,
  onSortChange,
}: TasksWidgetProps) {
  return (
    <article className="space-y-8">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Tasks</h2>
        <p className="text-muted-foreground">
          Search and organize a small task list.
        </p>
      </header>
      <TasksSearch search={search} onSearch={onSearch} />
      <fieldset className="space-y-3">
        <legend className="font-medium">Status</legend>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="task-filter"
              checked={filter === 'all'}
              onChange={() => {
                onFilterChange('all')
              }}
            />
            All ({totalCount})
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="task-filter"
              checked={filter === 'open'}
              onChange={() => {
                onFilterChange('open')
              }}
            />
            Open ({openCount})
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="task-filter"
              checked={filter === 'completed'}
              onChange={() => {
                onFilterChange('completed')
              }}
            />
            Completed ({completedCount})
          </label>
        </div>
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="font-medium">Sort by title</legend>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="task-sort"
              checked={sort === 'title'}
              onChange={() => {
                onSortChange('title')
              }}
            />
            A to Z
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="task-sort"
              checked={sort === 'title-desc'}
              onChange={() => {
                onSortChange('title-desc')
              }}
            />
            Z to A
          </label>
        </div>
      </fieldset>
      <section aria-labelledby="task-results-heading" className="space-y-3">
        <h3 id="task-results-heading" className="text-xl font-semibold">
          Results
        </h3>
        <output>
          {tasks.length} of {totalCount} tasks
        </output>
        {tasks.length === 0 ? (
          <p>No tasks match your search and status.</p>
        ) : (
          <ul className="divide-y">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <span className="wrap-anywhere">{task.title}</span>
                <span className="text-sm text-muted-foreground">
                  {task.completed ? 'Completed' : 'Open'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  )
}
