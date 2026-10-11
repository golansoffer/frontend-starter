import { createFileRoute } from '@tanstack/react-router'

import { AsyncButton } from '@/features/export-example/async-button'
import { usePrepareSample } from '@/features/export-example/use-prepare-sample'

export const Route = createFileRoute('/_examples/async-button')({
  component: AsyncButtonRoute,
})

function AsyncButtonRoute() {
  const title = '1. Controlled async button'
  const props = usePrepareSample()
  return (
    <article className="space-y-4">
      <title>{title}</title>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">
        Prepare a sample receipt. This demonstration creates no file.
      </p>
      <AsyncButton {...props} />
    </article>
  )
}
