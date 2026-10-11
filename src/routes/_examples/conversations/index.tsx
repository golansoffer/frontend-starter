import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_examples/conversations/')({
  beforeLoad: () => {
    redirect({ to: '/conversations/new', throw: true })
  },
})
