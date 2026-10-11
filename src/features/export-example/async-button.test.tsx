import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, expectTypeOf, it, vi } from 'vitest'

import {
  AsyncButton,
  type AsyncButtonProps,
} from '@/features/export-example/async-button'

it('invokes the ready action and prevents native interaction while pending', async () => {
  const user = userEvent.setup()
  const onClick = vi.fn()
  const { rerender } = render(<AsyncButton kind="ready" onClick={onClick} />)
  await user.click(screen.getByRole('button', { name: 'Prepare sample' }))
  expect(onClick).toHaveBeenCalledOnce()

  rerender(<AsyncButton kind="pending" />)
  const pending = screen.getByRole('button', { name: 'Prepare sample' })
  expect(pending).toBeDisabled()
  expect(pending).toHaveAttribute('aria-busy', 'true')
  expect(screen.getByRole('status')).toHaveTextContent('Preparing sample…')
  await user.click(pending)
  expect(onClick).toHaveBeenCalledOnce()
})

it('reports an error with a keyboard accessible retry action', async () => {
  const user = userEvent.setup()
  const retry = vi.fn()
  render(
    <AsyncButton kind="error" message="Try preparing again." onClick={retry} />,
  )
  expect(screen.getByRole('alert')).toHaveTextContent('Try preparing again.')
  await user.tab()
  expect(screen.getByRole('button', { name: 'Try again' })).toHaveFocus()
  await user.keyboard('{Enter}')
  expect(retry).toHaveBeenCalledOnce()
})

it('preserves the button across a pending request and allows keyboard retry', async () => {
  const user = userEvent.setup()
  const run = vi.fn()
  const retry = vi.fn()
  const { rerender } = render(<AsyncButton kind="ready" onClick={run} />)
  const button = screen.getByRole('button', { name: 'Prepare sample' })
  await user.tab()
  await user.keyboard('{Enter}')
  expect(run).toHaveBeenCalledOnce()

  rerender(<AsyncButton kind="pending" />)
  expect(screen.getByRole('button', { name: 'Prepare sample' })).toBe(button)
  rerender(<AsyncButton kind="error" message="Please retry." onClick={retry} />)
  expect(screen.getByRole('button', { name: 'Try again' })).toBe(button)
  expect(button).toHaveFocus()
  await user.keyboard('{Enter}')
  expect(retry).toHaveBeenCalledOnce()
  expect(run).toHaveBeenCalledOnce()
})

it('reports terminal success without an initiating action', () => {
  render(<AsyncButton kind="success" message="sample.csv: 3 rows ready." />)
  expect(screen.getByRole('status')).toHaveTextContent(
    'sample.csv: 3 rows ready.',
  )
  expect(screen.getByRole('button', { name: 'Sample ready' })).toBeDisabled()
})

it('requires each state payload and forbids actions through variables and spreads', () => {
  expectTypeOf<{
    kind: 'ready'
    onClick: () => void
  }>().toExtend<AsyncButtonProps>()
  expectTypeOf<{ kind: 'pending' }>().toExtend<AsyncButtonProps>()
  expectTypeOf<{
    kind: 'error'
    message: string
    onClick: () => void
  }>().toExtend<AsyncButtonProps>()
  expectTypeOf<{
    kind: 'success'
    message: string
  }>().toExtend<AsyncButtonProps>()
  expectTypeOf<{ onClick: () => void }>().not.toExtend<AsyncButtonProps>()
  expectTypeOf<{ kind: 'ready' }>().not.toExtend<AsyncButtonProps>()
  expectTypeOf<{
    kind: 'error'
    onClick: () => void
  }>().not.toExtend<AsyncButtonProps>()
  expectTypeOf<{
    kind: 'error'
    message: string
  }>().not.toExtend<AsyncButtonProps>()
  expectTypeOf<{ kind: 'success' }>().not.toExtend<AsyncButtonProps>()

  const pending: { kind: 'pending'; onClick: () => void } = {
    kind: 'pending',
    onClick: vi.fn(),
  }
  const success: { kind: 'success'; message: string; onClick: () => void } = {
    kind: 'success',
    message: 'Ready.',
    onClick: vi.fn(),
  }
  const pendingSpread = { ...pending }
  const successSpread = { ...success }
  expectTypeOf(pending).not.toExtend<AsyncButtonProps>()
  expectTypeOf(success).not.toExtend<AsyncButtonProps>()
  expectTypeOf(pendingSpread).not.toExtend<AsyncButtonProps>()
  expectTypeOf(successSpread).not.toExtend<AsyncButtonProps>()
  expectTypeOf<{
    kind: 'pending'
    onClick: undefined
  }>().not.toExtend<AsyncButtonProps>()
})
