import { createMemoryHistory, createRouter } from '@tanstack/react-router'
import { expect, it, vi } from 'vitest'

import { conversationApi } from '@/features/conversations/conversation-api'
import { createQueryClient } from '@/lib/query-client'
import { routeTree } from '@/routeTree.gen'

it('rejects an invalid route identity before requesting conversation data', async () => {
  const read = vi.spyOn(conversationApi, 'read')
  const client = createQueryClient()
  const router = createRouter({
    routeTree,
    context: { queryClient: client },
    history: createMemoryHistory({
      initialEntries: ['/conversations/invalid'],
    }),
  })
  await router.load()
  expect(router.state.matches.at(-1)?.status).toBe('error')
  expect(read).not.toHaveBeenCalled()
  client.clear()
})

it('reports a missing conversation as not found', async () => {
  const client = createQueryClient()
  const router = createRouter({
    routeTree,
    context: { queryClient: client },
    history: createMemoryHistory({
      initialEntries: ['/conversations/conversation-9999'],
    }),
  })
  await router.load()
  expect(router.state.matches.at(-1)?.status).toBe('notFound')
  client.clear()
})

it('preserves unexpected conversation failures as errors', async () => {
  const failure = new Error('Unexpected failure')
  vi.spyOn(conversationApi, 'read').mockRejectedValueOnce(failure)
  const client = createQueryClient()
  const router = createRouter({
    routeTree,
    context: { queryClient: client },
    history: createMemoryHistory({
      initialEntries: ['/conversations/conversation-1'],
    }),
  })
  await router.load()
  expect(router.state.matches.at(-1)?.status).toBe('error')
  expect(router.state.matches.at(-1)?.error).toBe(failure)
  client.clear()
})
