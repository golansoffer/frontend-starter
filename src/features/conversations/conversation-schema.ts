import { z } from 'zod'

export const conversationIdSchema = z.string().regex(/^conversation-[1-9]\d*$/u)
export const titleLimit = 80
export const messageLimit = 1000

export const newConversationSchema = z.object({
  title: z.string().trim().min(1, 'Enter a title.').max(titleLimit),
})

export const messageSchema = z.object({
  text: z.string().trim().min(1, 'Enter a message.').max(messageLimit),
})

export const conversationResponseSchema = z
  .object({
    conversation_id: conversationIdSchema,
    subject: z.string().trim().min(1),
    messages: z
      .array(
        z.object({
          message_id: z.string().min(1),
          body: z.string().trim().min(1),
        }),
      )
      .refine(
        (messages) =>
          new Set(messages.map((message) => message.message_id)).size ===
          messages.length,
        'Message IDs must be unique.',
      ),
  })
  .transform((response) => ({
    id: response.conversation_id,
    title: response.subject,
    messages: response.messages.map((message) => ({
      id: message.message_id,
      text: message.body,
    })),
  }))

export function parseConversationFor(id: string, response: unknown) {
  return conversationResponseSchema
    .refine(
      (conversation) => conversation.id === id,
      'Conversation identity does not match the request.',
    )
    .parse(response)
}
