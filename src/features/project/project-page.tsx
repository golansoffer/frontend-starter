export type ProjectPageProps = {
  name: string
  description: string
}

export function ProjectPage({ name, description }: ProjectPageProps) {
  return (
    <article className="space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight">{name}</h1>
      <section aria-labelledby="project-data-heading" className="space-y-2">
        <h2 id="project-data-heading" className="text-xl font-semibold">
          Project data
        </h2>
        <p className="text-muted-foreground">{description}</p>
      </section>
    </article>
  )
}
