import { z } from 'zod'

import { searchTextSchema } from '@/features/tasks/tasks-search-schema'

const defaults = { search: '', filter: 'all', sort: 'title' } as const

export const tasksSearchSchema = z.object({
  search: searchTextSchema.default(defaults.search).catch(defaults.search),
  filter: z
    .enum(['all', 'open', 'completed'])
    .default(defaults.filter)
    .catch(defaults.filter),
  sort: z
    .enum(['title', 'title-desc'])
    .default(defaults.sort)
    .catch(defaults.sort),
})
