import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { HttpError, NetworkError, getJson } from '@/lib/http'
import { createQueryClient } from '@/lib/query-client'

describe('query retry policy', () => {
  it.each([
    [0, new NetworkError(new TypeError('offline')), true],
    [2, new NetworkError(new TypeError('offline')), false],
    [0, new HttpError(503), true],
    [2, new HttpError(503), false],
    [0, new HttpError(401), false],
    [0, new z.ZodError([]), false],
    [0, new SyntaxError('Invalid JSON'), false],
    [0, new Error('Application failure'), false],
    [0, new TypeError('Adapter failure'), false],
    [0, new DOMException('Aborted', 'AbortError'), false],
  ])('handles attempt %i and %s', (count, error, expected) => {
    const client = createQueryClient()
    const retry = client.getDefaultOptions().queries?.retry
    expect(typeof retry).toBe('function')
    if (typeof retry !== 'function') {
      throw new Error('Expected a retry function')
    }
    expect(retry(count, error)).toBe(expected)
    client.clear()
  })

  it('does not fetch malformed JSON repeatedly', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(new Response('invalid json')),
    )
    const client = createQueryClient()
    await expect(
      client.query({
        queryKey: ['malformed'],
        queryFn: ({ signal }) =>
          getJson('/profile', z.object({ name: z.string() }), signal),
        retryDelay: 0,
      }),
    ).rejects.toBeInstanceOf(SyntaxError)
    expect(fetch).toHaveBeenCalledOnce()
    client.clear()
  })

  it('does not share caches between clients', () => {
    const first = createQueryClient()
    const second = createQueryClient()
    first.setQueryData(['example'], 'private')
    expect(second.getQueryData(['example'])).toBeUndefined()
    expect(first.getDefaultOptions().mutations?.retry).toBe(false)
    first.clear()
    second.clear()
  })
})
