import { expect, it } from 'vitest'

import { tasksSearchSchema } from '@/routes/_examples/tasks/-search'

it('validates URL preferences and discards unknown input', () => {
  expect(
    tasksSearchSchema.parse({
      search: '  Review  ',
      filter: 'completed',
      sort: 'title-desc',
      internal: 'discard',
    }),
  ).toEqual({ search: 'Review', filter: 'completed', sort: 'title-desc' })
})

it('uses deliberate defaults for missing or invalid display preferences', () => {
  const defaults = { search: '', filter: 'all', sort: 'title' }
  expect(tasksSearchSchema.parse({})).toEqual(defaults)
  expect(
    tasksSearchSchema.parse({ search: 42, filter: ['open'], sort: 'random' }),
  ).toEqual(defaults)
  expect(tasksSearchSchema.parse({ search: 'a'.repeat(101) })).toEqual(defaults)
})
