import { createFileRoute, notFound } from '@tanstack/react-router'

import { ConversationNotFoundError } from '@/features/conversations/conversation-api'
import {
  conversationQueryOptions,
  useConversation,
} from '@/features/conversations/conversation-query'
import { ConversationWidget } from '@/features/conversations/conversation-widget'
import { conversationParamsSchema } from '@/routes/_examples/conversations/$conversationId/-params'

export const Route = createFileRoute(
  '/_examples/conversations/$conversationId',
)({
  params: { parse: (params) => conversationParamsSchema.parse(params) },
  loader: async ({ context, params }) => {
    try {
      return await context.queryClient.query(
        conversationQueryOptions(params.conversationId),
      )
    } catch (error) {
      if (error instanceof ConversationNotFoundError) {
        notFound({ throw: true })
      }
      throw error
    }
  },
  component: ConversationRoute,
})

function ConversationRoute() {
  const { conversationId } = Route.useParams()
  return <Conversation key={conversationId} id={conversationId} />
}

type ConversationProps = { id: string }

function Conversation({ id }: ConversationProps) {
  const props = useConversation(id)
  return (
    <>
      <title>{props.title}</title>
      <ConversationWidget {...props} />
    </>
  )
}
