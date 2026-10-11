import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { useCreateConversation } from '@/features/conversations/conversation-query'
import { NewConversationWidget } from '@/features/conversations/new-conversation-widget'

export const Route = createFileRoute('/_examples/conversations/new')({
  component: NewConversationRoute,
})

function NewConversationRoute() {
  const title = '3. New conversation'
  const navigate = Route.useNavigate()
  const [failedNavigation, setFailedNavigation] = useState<string>()
  const props = useCreateConversation((conversationId) => {
    setFailedNavigation(undefined)
    navigate({
      to: '/conversations/$conversationId',
      params: { conversationId },
    }).catch(() => {
      setFailedNavigation(conversationId)
    })
  })

  return (
    <article className="space-y-6">
      <title>{title}</title>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <NewConversationWidget {...props} />
      {failedNavigation !== undefined && (
        <p role="alert">
          The conversation was created, but could not open automatically.{' '}
          <Link
            to="/conversations/$conversationId"
            params={{ conversationId: failedNavigation }}
            className="underline underline-offset-4"
          >
            Open conversation
          </Link>
        </p>
      )}
    </article>
  )
}
