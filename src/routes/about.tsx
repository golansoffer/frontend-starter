import { Link, createFileRoute } from '@tanstack/react-router'

import { buttonVariants } from '@/components/ui/button'

export const Route = createFileRoute('/about')({ component: AboutPage })

function AboutPage() {
  return (
    <article className="space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight">
        About this starter
      </h1>
      <p className="text-muted-foreground">
        A minimal example with typed routes, validated data, and accessible
        forms.
      </p>
      <Link to="/" className={buttonVariants()}>
        Back to home
      </Link>
    </article>
  )
}
