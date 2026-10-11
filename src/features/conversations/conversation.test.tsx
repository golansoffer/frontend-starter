import { QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, expectTypeOf, it, vi } from 'vitest'

import { conversationApi } from '@/features/conversations/conversation-api'
import {
  conversationQueryOptions,
  useConversation,
  useCreateConversation,
} from '@/features/conversations/conversation-query'
import { ConversationWidget } from '@/features/conversations/conversation-widget'
import type { MessageComposerProps } from '@/features/conversations/message-composer'
import {
  NewConversationWidget,
  type NewConversationWidgetProps,
} from '@/features/conversations/new-conversation-widget'
import { createQueryClient } from '@/lib/query-client'

type NewConversationExampleProps = { onCreated: (id: string) => void }

function NewConversationExample({ onCreated }: NewConversationExampleProps) {
  return <NewConversationWidget {...useCreateConversation(onCreated)} />
}

type ConversationExampleProps = { id: string }

function ConversationExample({ id }: ConversationExampleProps) {
  return <ConversationWidget {...useConversation(id)} />
}

it('validates a title, adapts submission, and reports the created identity after caching', async () => {
  const user = userEvent.setup()
  const client = createQueryClient()
  const onCreated = vi.fn<(id: string) => void>()
  const create = vi.spyOn(conversationApi, 'create')
  render(
    <QueryClientProvider client={client}>
      <NewConversationExample onCreated={onCreated} />
    </QueryClientProvider>,
  )
  await user.click(screen.getByRole('button', { name: 'Create conversation' }))
  expect(await screen.findByText('Enter a title.')).toBeVisible()
  await user.type(
    screen.getByRole('textbox', { name: 'Title' }),
    '  Craft  {Enter}',
  )
  expect(await screen.findByText('Created Craft.')).toBeVisible()
  expect(create).toHaveBeenCalledWith({ title: 'Craft' })
  expect(onCreated).toHaveBeenCalledOnce()
  const entries = client.getQueriesData({ queryKey: ['conversations'] })
  expect(entries).toHaveLength(1)
  expect(entries[0]?.[0]).toEqual([
    'conversations',
    onCreated.mock.calls[0]?.[0],
  ])
  expect(entries[0]?.[1]).toMatchObject({ title: 'Craft', messages: [] })
  client.clear()
})

it('removes create actions while pending and keeps domain completion after unmount', async () => {
  const user = userEvent.setup()
  const client = createQueryClient()
  const finish = vi.fn<(value: unknown) => void>()
  const create = vi.spyOn(conversationApi, 'create').mockReturnValueOnce(
    new Promise((resolve) => {
      finish.mockImplementation(resolve)
    }),
  )
  const onCreated = vi.fn()
  const { unmount } = render(
    <QueryClientProvider client={client}>
      <NewConversationExample onCreated={onCreated} />
    </QueryClientProvider>,
  )
  await user.type(
    screen.getByRole('textbox', { name: 'Title' }),
    'Slow creation{Enter}',
  )
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Creating conversation…',
  )
  expect(
    screen.getByRole('button', { name: 'Create conversation' }),
  ).toBeDisabled()
  expect(screen.getByRole('textbox', { name: 'Title' })).toHaveFocus()
  expect(screen.getByRole('textbox', { name: 'Title' })).toHaveAttribute(
    'readonly',
  )
  expect(
    fireEvent.submit(screen.getByRole('form', { name: 'New conversation' })),
  ).toBe(false)
  expect(create).toHaveBeenCalledOnce()
  unmount()
  finish({
    conversation_id: 'conversation-30',
    subject: 'Slow creation',
    messages: [],
  })
  await waitFor(() => {
    expect(
      client.getQueryData(conversationQueryOptions('conversation-30').queryKey),
    ).toEqual({ id: 'conversation-30', title: 'Slow creation', messages: [] })
  })
  expect(onCreated).not.toHaveBeenCalled()
  client.clear()
})

it('keeps a rejected creation draft and lets the user correct and retry it', async () => {
  const user = userEvent.setup()
  const client = createQueryClient()
  vi.spyOn(conversationApi, 'create').mockRejectedValueOnce(
    new Error('Creation failed.'),
  )
  render(
    <QueryClientProvider client={client}>
      <NewConversationExample onCreated={vi.fn()} />
    </QueryClientProvider>,
  )
  await user.type(
    screen.getByRole('textbox', { name: 'Title' }),
    'Draft{Enter}',
  )
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Could not create the conversation. Try again.',
  )
  expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('Draft')
  expect(screen.getByRole('textbox', { name: 'Title' })).toHaveFocus()
  await user.keyboard(' corrected{Enter}')
  expect(await screen.findByText('Created Draft corrected.')).toBeVisible()
  client.clear()
})

it('keeps the thread visible while sending, preserves failed drafts, and resets after success', async () => {
  const user = userEvent.setup()
  const client = createQueryClient()
  await client.query(conversationQueryOptions('conversation-1'))
  const fail = vi.fn<(reason: Error) => void>()
  const send = vi.spyOn(conversationApi, 'send').mockReturnValueOnce(
    new Promise((_resolve, reject) => {
      fail.mockImplementation(reject)
    }),
  )
  render(
    <QueryClientProvider client={client}>
      <ConversationExample id="conversation-1" />
    </QueryClientProvider>,
  )
  await user.click(screen.getByRole('button', { name: 'Send message' }))
  expect(await screen.findByText('Enter a message.')).toBeVisible()
  await user.type(
    screen.getByRole('textbox', { name: 'Message' }),
    '  Keep this draft  {Enter}',
  )
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Sending message…',
  )
  expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled()
  expect(screen.getByRole('textbox', { name: 'Message' })).toHaveFocus()
  expect(screen.getByRole('textbox', { name: 'Message' })).toHaveAttribute(
    'readonly',
  )
  expect(
    fireEvent.submit(screen.getByRole('form', { name: 'Send message' })),
  ).toBe(false)
  expect(send).toHaveBeenCalledOnce()
  expect(screen.getByRole('heading', { name: 'Frontend craft' })).toBeVisible()
  expect(screen.getByRole('list', { name: 'Messages' })).toHaveTextContent(
    'A conversation keeps related messages together.',
  )
  fail(new Error('Sending failed.'))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Could not send the message. Try again.',
  )
  expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue(
    '  Keep this draft  ',
  )
  expect(screen.getByRole('textbox', { name: 'Message' })).toHaveFocus()
  await user.keyboard('{Enter}')
  expect(await screen.findByRole('status')).toHaveTextContent('Message sent.')
  expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('')
  expect(screen.getByRole('textbox', { name: 'Message' })).toHaveFocus()
  expect(screen.getByRole('list', { name: 'Messages' })).toHaveTextContent(
    'Keep this draft',
  )
  expect(send).toHaveBeenLastCalledWith({
    conversationId: 'conversation-1',
    text: 'Keep this draft',
  })
  client.clear()
})

it('rejects pending actions, missing tags, and incomplete error states', () => {
  type InvalidCreate = { kind: 'pending'; title: string; onCreate: () => void }
  type InvalidSend = { kind: 'pending'; text: string; onSend: () => void }
  expectTypeOf<InvalidCreate>().not.toExtend<NewConversationWidgetProps>()
  expectTypeOf<InvalidSend>().not.toExtend<MessageComposerProps>()
  expectTypeOf<{
    title: string
    onCreate: () => void
  }>().not.toExtend<NewConversationWidgetProps>()
  expectTypeOf<{
    kind: 'error'
    text: string
  }>().not.toExtend<MessageComposerProps>()
})

it('rejects a send response for another conversation without losing the draft', async () => {
  const user = userEvent.setup()
  const client = createQueryClient()
  const options = conversationQueryOptions('conversation-1')
  const before = await client.query(options)
  vi.spyOn(conversationApi, 'send').mockResolvedValueOnce({
    conversation_id: 'conversation-99',
    subject: 'Wrong conversation',
    messages: [],
  })
  render(
    <QueryClientProvider client={client}>
      <ConversationExample id="conversation-1" />
    </QueryClientProvider>,
  )
  await user.type(
    screen.getByRole('textbox', { name: 'Message' }),
    'Retain this{Enter}',
  )
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Could not send the message. Try again.',
  )
  expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue(
    'Retain this',
  )
  expect(client.getQueryData(options.queryKey)).toEqual(before)
  client.clear()
})

it('prevents an older read from replacing a completed send', async () => {
  const user = userEvent.setup()
  const client = createQueryClient()
  const options = conversationQueryOptions('conversation-1')
  await client.query(options)
  render(
    <QueryClientProvider client={client}>
      <ConversationExample id="conversation-1" />
    </QueryClientProvider>,
  )
  const finishRead = vi.fn<(value: unknown) => void>()
  vi.spyOn(conversationApi, 'read').mockReturnValueOnce(
    new Promise((resolve) => {
      finishRead.mockImplementation(resolve)
    }),
  )
  const earlierRead = expect(
    client.query({ ...options, staleTime: 0 }),
  ).resolves.toMatchObject({ title: 'Frontend craft' })
  await user.type(
    screen.getByRole('textbox', { name: 'Message' }),
    'Newer message{Enter}',
  )
  expect(await screen.findByRole('status')).toHaveTextContent('Message sent.')
  finishRead({
    conversation_id: 'conversation-1',
    subject: 'Old snapshot',
    messages: [],
  })
  await earlierRead
  expect(screen.getByRole('heading', { name: 'Frontend craft' })).toBeVisible()
  expect(
    client
      .getQueryData(options.queryKey)
      ?.messages.map((message) => message.text),
  ).toContain('Newer message')
  client.clear()
})
