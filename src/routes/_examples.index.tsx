import { createFileRoute } from '@tanstack/react-router'

import { ProjectPage } from '@/features/project/project-page'
import {
  projectQueryOptions,
  useProject,
} from '@/features/project/project-query'

export const Route = createFileRoute('/_examples/')({
  loader: ({ context }) => context.queryClient.query(projectQueryOptions),
  component: ProjectRoute,
})

function ProjectRoute() {
  const props = useProject()
  return <ProjectPage {...props} />
}
