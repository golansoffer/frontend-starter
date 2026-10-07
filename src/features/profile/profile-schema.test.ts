import { describe, expect, it } from 'vitest'

import { profileSchema } from '@/features/profile/profile-schema'

describe('profile schema', () => {
  it('trims the submitted name', () => {
    expect(
      profileSchema.parse({ displayName: '  Ada  ', email: 'ada@example.com' }),
    ).toEqual({ displayName: 'Ada', email: 'ada@example.com' })
  })
  it.each([
    { displayName: ' ', email: 'ada@example.com' },
    { displayName: 'A', email: 'ada@example.com' },
    { displayName: 'A'.repeat(51), email: 'ada@example.com' },
    { displayName: 'Ada', email: 'invalid' },
  ])('rejects invalid data: %j', (input) => {
    expect(profileSchema.safeParse(input).success).toBe(false)
  })
})
