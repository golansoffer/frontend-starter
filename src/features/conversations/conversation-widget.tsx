import {
  MessageComposer,
  type MessageComposerProps,
} from '@/features/conversations/message-composer'

export type ConversationWidgetProps = {
  title: string
  messages: readonly { id: string; text: string }[]
  composer: MessageComposerProps
}

export function ConversationWidget({
  title,
  messages,
  composer,
}: ConversationWidgetProps) {
  return (
    <article className="space-y-6 wrap-anywhere">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <ol aria-label="Messages" className="space-y-3">
        {messages.map((message) => (
          <li key={message.id}>{message.text}</li>
        ))}
      </ol>
      <MessageComposer {...composer} />
    </article>
  )
}
