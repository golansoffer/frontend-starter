import { expect, it } from 'vitest'

import { conversationParamsSchema } from '@/routes/_examples/conversations/$conversationId/-params'

it('accepts a conversation identity and rejects invalid route inputs', () => {
  expect(
    conversationParamsSchema.parse({ conversationId: 'conversation-42' }),
  ).toEqual({ conversationId: 'conversation-42' })
  for (const conversationId of [
    '',
    '42',
    'conversation-0',
    'conversation--1',
    42,
  ]) {
    expect(conversationParamsSchema.safeParse({ conversationId }).success).toBe(
      false,
    )
  }
})
