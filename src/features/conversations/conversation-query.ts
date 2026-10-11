import { revalidateLogic, useField, useForm } from '@tanstack/react-form'
import {
  queryOptions,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'

import { conversationApi } from '@/features/conversations/conversation-api'
import {
  conversationResponseSchema,
  messageSchema,
  newConversationSchema,
  parseConversationFor,
} from '@/features/conversations/conversation-schema'
import type { ConversationWidgetProps } from '@/features/conversations/conversation-widget'
import type { MessageComposerProps } from '@/features/conversations/message-composer'
import type { NewConversationWidgetProps } from '@/features/conversations/new-conversation-widget'

export function conversationQueryOptions(id: string) {
  return queryOptions({
    queryKey: ['conversations', id],
    networkMode: 'always',
    queryFn: async () =>
      parseConversationFor(id, await conversationApi.read(id)),
  })
}

export function useCreateConversation(
  onCreated: (id: string) => void,
): NewConversationWidgetProps {
  const client = useQueryClient()
  const mutation = useMutation({
    mutationKey: ['conversations', 'create'],
    networkMode: 'always',
    mutationFn: async (input: { title: string }) =>
      conversationResponseSchema.parse(
        await conversationApi.create(newConversationSchema.parse(input)),
      ),
    onSuccess: async (conversation) => {
      const options = conversationQueryOptions(conversation.id)
      await client.cancelQueries({ queryKey: options.queryKey, exact: true })
      client.setQueryData(options.queryKey, conversation)
    },
  })
  const form = useForm({
    defaultValues: { title: '' },
    validationLogic: revalidateLogic({
      mode: 'blur',
      modeAfterSubmission: 'change',
    }),
    validators: { onDynamic: newConversationSchema },
    onSubmit: ({ value }) => {
      mutation.mutate(value, {
        onSuccess: (conversation) => {
          onCreated(conversation.id)
        },
      })
    },
  })
  const field = useField({ form, name: 'title' })
  const title = field.state.value
  if (mutation.isPending) {
    return { kind: 'pending', title }
  }
  if (mutation.isSuccess) {
    return { kind: 'success', title: mutation.data.title }
  }
  const draft = {
    title,
    titleError: field.state.meta.errors
      .map((error) => error?.message)
      .join(' '),
    onTitleChange: (value: string) => {
      field.handleChange(value)
      mutation.reset()
    },
    onTitleBlur: field.handleBlur,
    onCreate: () => {
      form.handleSubmit().catch(() => {
        form.setErrorMap({
          onSubmit: {
            fields: { title: [{ message: 'Could not validate this title.' }] },
          },
        })
      })
    },
  }
  return mutation.isError
    ? {
        kind: 'error',
        ...draft,
        message: 'Could not create the conversation. Try again.',
      }
    : { kind: 'ready', ...draft }
}

export function useConversation(id: string): ConversationWidgetProps {
  const { data } = useSuspenseQuery(conversationQueryOptions(id))
  const composer = useMessageComposer(id)
  return { title: data.title, messages: data.messages, composer }
}

function useMessageComposer(conversationId: string): MessageComposerProps {
  const client = useQueryClient()
  const mutation = useMutation({
    mutationKey: ['conversations', conversationId, 'send'],
    scope: { id: conversationId },
    networkMode: 'always',
    mutationFn: async (input: { conversationId: string; text: string }) => {
      const message = messageSchema.parse(input)
      return parseConversationFor(
        input.conversationId,
        await conversationApi.send({
          conversationId: input.conversationId,
          ...message,
        }),
      )
    },
    onSuccess: async (conversation, input) => {
      const options = conversationQueryOptions(input.conversationId)
      await client.cancelQueries({ queryKey: options.queryKey, exact: true })
      client.setQueryData(options.queryKey, conversation)
    },
  })
  const form = useForm({
    defaultValues: { text: '' },
    validationLogic: revalidateLogic({
      mode: 'blur',
      modeAfterSubmission: 'change',
    }),
    validators: { onDynamic: messageSchema },
    onSubmit: ({ value }) => {
      mutation.mutate(
        { conversationId, ...value },
        {
          onSuccess: () => {
            form.reset()
          },
        },
      )
    },
  })
  const field = useField({ form, name: 'text' })
  const text = field.state.value
  if (mutation.isPending) {
    return { kind: 'pending', text }
  }
  const draft = {
    text,
    textError: field.state.meta.errors.map((error) => error?.message).join(' '),
    onTextChange: (value: string) => {
      field.handleChange(value)
      mutation.reset()
    },
    onTextBlur: field.handleBlur,
    onSend: () => {
      form.handleSubmit().catch(() => {
        form.setErrorMap({
          onSubmit: {
            fields: { text: [{ message: 'Could not validate this message.' }] },
          },
        })
      })
    },
  }
  switch (mutation.status) {
    case 'error':
      return {
        kind: 'error',
        ...draft,
        message: 'Could not send the message. Try again.',
      }
    case 'success':
      return { kind: 'success', ...draft }
    case 'idle':
      return { kind: 'ready', ...draft }
  }
}
