import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, expectTypeOf, it, vi } from 'vitest'

import {
  ProfileSubmission,
  type ProfileSubmissionProps,
} from '@/features/profile/profile-submission'

it('disables native submission while pending and restores it when idle', async () => {
  const user = userEvent.setup()
  const submit = vi.fn()
  type FormProps = { kind: 'idle' } | { kind: 'pending' }

  function Form(props: FormProps) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <ProfileSubmission {...props} />
      </form>
    )
  }
  const { rerender } = render(<Form kind="pending" />)
  const button = screen.getByRole('button', { name: 'Validate profile' })
  expect(button).toBeDisabled()
  expect(button).toHaveAttribute('aria-busy', 'true')
  expect(screen.getByRole('status')).toHaveTextContent('Validating profile…')
  await user.click(button)
  expect(submit).not.toHaveBeenCalled()

  rerender(<Form kind="idle" />)
  expect(button).toBeEnabled()
  await user.click(button)
  expect(submit).toHaveBeenCalledOnce()
})

it('requires the payload for each feedback state and forbids contradictory data', () => {
  expectTypeOf<{
    kind: 'success'
    displayName: string
  }>().toExtend<ProfileSubmissionProps>()
  expectTypeOf<{
    kind: 'error'
    message: string
  }>().toExtend<ProfileSubmissionProps>()
  expectTypeOf<{ kind: 'idle' }>().toExtend<ProfileSubmissionProps>()
  expectTypeOf<{ kind: 'pending' }>().toExtend<ProfileSubmissionProps>()

  expectTypeOf<{
    displayName: string
  }>().not.toExtend<ProfileSubmissionProps>()
  expectTypeOf<{
    kind: 'success'
  }>().not.toExtend<ProfileSubmissionProps>()
  expectTypeOf<{ kind: 'error' }>().not.toExtend<ProfileSubmissionProps>()
  expectTypeOf<{
    kind: 'error'
    message: string
    displayName: string
  }>().not.toExtend<ProfileSubmissionProps>()
  expectTypeOf<{
    kind: 'idle'
    message: undefined
  }>().not.toExtend<ProfileSubmissionProps>()
  expectTypeOf<{
    kind: 'pending'
    displayName: string
  }>().not.toExtend<ProfileSubmissionProps>()
})
