import { QueryClient } from '@tanstack/react-query'
import { expect, it, vi } from 'vitest'
import { z } from 'zod'

import {
  ConversationNotFoundError,
  conversationApi,
} from '@/features/conversations/conversation-api'
import { conversationQueryOptions } from '@/features/conversations/conversation-query'
import {
  conversationResponseSchema,
  messageSchema,
  newConversationSchema,
} from '@/features/conversations/conversation-schema'

it('creates independent conversations and appends messages to their owner', async () => {
  const first = conversationResponseSchema.parse(
    await conversationApi.create({ title: 'First' }),
  )
  const second = conversationResponseSchema.parse(
    await conversationApi.create({ title: 'Second' }),
  )
  const sent = conversationResponseSchema.parse(
    await conversationApi.send({ conversationId: first.id, text: 'Hello' }),
  )
  expect(sent).toEqual({
    id: first.id,
    title: 'First',
    messages: [{ id: 'message-1', text: 'Hello' }],
  })
  expect(
    conversationResponseSchema.parse(await conversationApi.read(first.id)),
  ).toEqual(sent)
  expect(
    conversationResponseSchema.parse(await conversationApi.read(second.id)),
  ).toEqual(second)
  expect(first.messages).toEqual([])
})

it('rejects missing conversations without creating them', async () => {
  await expect(
    conversationApi.read('conversation-9999'),
  ).rejects.toBeInstanceOf(ConversationNotFoundError)
  await expect(
    conversationApi.send({
      conversationId: 'conversation-9999',
      text: 'Hello',
    }),
  ).rejects.toBeInstanceOf(ConversationNotFoundError)
})

it('adapts wire names and validates input without carrying unknown fields', () => {
  expect(
    conversationResponseSchema.parse({
      conversation_id: 'conversation-1',
      subject: '  Craft  ',
      internal: 'private',
      messages: [
        { message_id: 'message-1', body: '  Hello  ', internal: true },
      ],
    }),
  ).toEqual({
    id: 'conversation-1',
    title: 'Craft',
    messages: [{ id: 'message-1', text: 'Hello' }],
  })
  expect(newConversationSchema.parse({ title: '  Craft  ' })).toEqual({
    title: 'Craft',
  })
  expect(messageSchema.parse({ text: '  Hello  ' })).toEqual({ text: 'Hello' })
  expect(newConversationSchema.safeParse({ title: ' ' }).success).toBe(false)
  expect(
    newConversationSchema.safeParse({ title: 'a'.repeat(81) }).success,
  ).toBe(false)
  expect(messageSchema.safeParse({ text: ' ' }).success).toBe(false)
  expect(messageSchema.safeParse({ text: 'a'.repeat(1001) }).success).toBe(
    false,
  )
})

it.each([
  { conversation_id: 'broken', subject: 'Craft', messages: [] },
  {
    conversation_id: 'conversation-2',
    subject: 'Wrong conversation',
    messages: [],
  },
  {
    conversation_id: 'conversation-1',
    subject: 'Craft',
    messages: [
      { message_id: 'duplicate', body: 'First' },
      { message_id: 'duplicate', body: 'Second' },
    ],
  },
])('rejects invalid response identity before caching: %j', async (response) => {
  vi.spyOn(conversationApi, 'read').mockResolvedValueOnce(response)
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const options = conversationQueryOptions('conversation-1')
  await expect(client.query(options)).rejects.toBeInstanceOf(z.ZodError)
  expect(client.getQueryData(options.queryKey)).toBeUndefined()
  client.clear()
})
