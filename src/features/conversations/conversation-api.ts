const conversations = new Map([
  [
    'conversation-1',
    {
      conversation_id: 'conversation-1',
      subject: 'Frontend craft',
      messages: [
        {
          message_id: 'message-1',
          body: 'A conversation keeps related messages together.',
        },
        {
          message_id: 'message-2',
          body: 'Send a message to try the form and mutation flow.',
        },
      ],
    },
  ],
])
let nextConversationId = 2

export class ConversationNotFoundError extends Error {
  constructor() {
    super('Conversation not found. Demo data resets on reload.')
    this.name = 'ConversationNotFoundError'
  }
}

function findConversation(id: string) {
  const conversation = conversations.get(id)
  if (!conversation) {
    throw new ConversationNotFoundError()
  }
  return conversation
}

export const conversationApi = {
  read: async (id: string): Promise<unknown> =>
    structuredClone(findConversation(id)),
  create: async (input: { title: string }): Promise<unknown> => {
    const id = `conversation-${String(nextConversationId++)}`
    const conversation = {
      conversation_id: id,
      subject: input.title,
      messages: [],
    }
    conversations.set(id, conversation)
    return structuredClone(conversation)
  },
  send: async (input: {
    conversationId: string
    text: string
  }): Promise<unknown> => {
    const conversation = findConversation(input.conversationId)
    const updated = {
      ...conversation,
      messages: [
        ...conversation.messages,
        {
          message_id: `message-${String(conversation.messages.length + 1)}`,
          body: input.text,
        },
      ],
    }
    conversations.set(input.conversationId, updated)
    return structuredClone(updated)
  },
}
