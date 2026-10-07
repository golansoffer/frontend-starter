import { expect, it } from 'vitest'

import { cn } from '@/lib/utils'

it('combines conditional classes and resolves Tailwind conflicts', () => {
  expect(cn('px-2', false, undefined, { 'font-bold': true }, 'px-4')).toBe(
    'font-bold px-4',
  )
})
