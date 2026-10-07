import { beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  vi.resetModules()
})

describe('public environment', () => {
  it('has a default for a fresh clone', async () => {
    vi.stubEnv('VITE_APP_NAME', undefined)
    const { env } = await import('@/lib/env')
    expect(env.VITE_APP_NAME).toBe('Frontend starter')
  })

  it('accepts a configured app name', async () => {
    vi.stubEnv('VITE_APP_NAME', 'My app')
    const { env } = await import('@/lib/env')
    expect(env.VITE_APP_NAME).toBe('My app')
  })

  it('rejects an empty name', async () => {
    vi.stubEnv('VITE_APP_NAME', '  ')
    await expect(import('@/lib/env')).rejects.toThrow()
  })
})
