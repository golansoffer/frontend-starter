import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ProfileForm } from '@/features/profile/profile-form'
import { profileSchema } from '@/features/profile/profile-schema'

describe('profile form', () => {
  it('accepts keyboard submission after correcting an invalid submission', async () => {
    const user = userEvent.setup()
    render(<ProfileForm />)
    await user.click(screen.getByRole('button', { name: 'Validate profile' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Display name' }),
      'Ada',
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Email' }),
      'ada@example.com{Enter}',
    )
    expect(
      await screen.findByText(
        'Validated profile for Ada. Nothing was sent or saved.',
      ),
    ).toBeVisible()
  })

  it('reports unexpected submission failures without an unhandled rejection', async () => {
    const user = userEvent.setup()
    render(<ProfileForm />)
    await user.type(
      screen.getByRole('textbox', { name: 'Display name' }),
      'Ada',
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Email' }),
      'ada@example.com',
    )
    vi.spyOn(profileSchema, 'parse').mockImplementationOnce(() => {
      throw new Error('Unexpected failure')
    })
    await user.click(screen.getByRole('button', { name: 'Validate profile' }))
    expect(
      await screen.findByText('Validation could not finish. Please try again.'),
    ).toBeVisible()
  })

  it('shows accessible validation errors on an empty submission', async () => {
    const user = userEvent.setup()
    render(<ProfileForm />)
    await user.click(screen.getByRole('button', { name: 'Validate profile' }))
    expect(await screen.findByText('Use at least 2 characters.')).toBeVisible()
    expect(
      screen.getByRole('textbox', { name: 'Display name' }),
    ).toHaveAccessibleDescription('Use at least 2 characters.')
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('validates on blur, allows correction, and clears a stale confirmation', async () => {
    const user = userEvent.setup()
    render(<ProfileForm />)
    await user.type(
      screen.getByRole('textbox', { name: 'Display name' }),
      '  Ada  ',
    )
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'invalid')
    await user.tab()
    expect(
      await screen.findByText('Enter a valid email address.'),
    ).toBeVisible()
    await user.clear(screen.getByRole('textbox', { name: 'Email' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Email' }),
      'ada@example.com',
    )
    await user.click(screen.getByRole('button', { name: 'Validate profile' }))
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Validated profile for Ada. Nothing was sent or saved.',
    )
    expect(
      screen.queryByText('Enter a valid email address.'),
    ).not.toBeInTheDocument()
    await user.type(
      screen.getByRole('textbox', { name: 'Display name' }),
      ' Lovelace',
    )
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })
})
