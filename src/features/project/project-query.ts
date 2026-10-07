import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { getJson } from '@/lib/http'
import type { ProjectPageProps } from '@/features/project/project-page'

const projectResponseSchema = z
  .object({
    project_name: z.string().trim().min(1),
    project_description: z.string().trim().min(1),
  })
  .transform((response) => ({
    name: response.project_name,
    description: response.project_description,
  }))

export const projectQueryOptions = queryOptions({
  queryKey: ['example', 'project'],
  queryFn: ({ signal }) =>
    getJson('/example-project.json', projectResponseSchema, signal),
})

export function useProject(): ProjectPageProps {
  const { data } = useSuspenseQuery(projectQueryOptions)
  return data
}
