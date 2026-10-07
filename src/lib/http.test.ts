import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { HttpError, NetworkError, getJson } from '@/lib/http'

const schema = z.object({ name: z.string() })

describe('getJson', () => {
  it('validates the response and passes cancellation to fetch', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ name: 'Ada' }))
    vi.stubGlobal('fetch', fetchMock)
    const signal = new AbortController().signal
    await expect(getJson('/profile', schema, signal)).resolves.toEqual({
      name: 'Ada',
    })
    expect(fetchMock).toHaveBeenCalledWith('/profile', {
      signal,
      headers: { Accept: 'application/json' },
    })
  })

  it('rejects malformed server data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(Response.json({ name: 42 })),
    )
    await expect(
      getJson('/profile', schema, new AbortController().signal),
    ).rejects.toBeInstanceOf(z.ZodError)
  })

  it('reports HTTP failures without trusting their body', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response('no', { status: 503 })),
    )
    await expect(
      getJson('/profile', schema, new AbortController().signal),
    ).rejects.toMatchObject({ name: 'HttpError', status: 503 })
    expect(new HttpError(404).message).toBe('Request failed (404).')
  })

  it('classifies fetch failures without exposing transport details to callers', async () => {
    const error = new TypeError('Network failed')
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(error))
    await expect(
      getJson('/profile', schema, new AbortController().signal),
    ).rejects.toMatchObject({ name: 'NetworkError', cause: error })
    expect(new NetworkError(error).message).toBe('Network request failed.')
  })

  it('rejects invalid JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(new Response('invalid json')),
    )
    await expect(
      getJson('/profile', schema, new AbortController().signal),
    ).rejects.toBeInstanceOf(SyntaxError)
  })

  it.each([
    new DOMException('Aborted', 'AbortError'),
    new TypeError('Custom cancellation reason'),
  ])('preserves cancellation: %s', async (error) => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(error))
    await expect(
      getJson('/profile', schema, AbortSignal.abort(error)),
    ).rejects.toBe(error)
  })

  it('preserves other failures without classifying them as retryable', async () => {
    const error = new DOMException('Blocked', 'SecurityError')
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(error))
    await expect(
      getJson('/profile', schema, new AbortController().signal),
    ).rejects.toBe(error)
  })
})
