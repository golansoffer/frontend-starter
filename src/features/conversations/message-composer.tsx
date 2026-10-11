import type { ChangeEvent, SubmitEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { messageLimit } from '@/features/conversations/conversation-schema'

export type MessageComposerProps = { text: string } & (
  | {
      kind: 'ready'
      textError: string
      onTextChange: (text: string) => void
      onTextBlur: () => void
      onSend: () => void
      message?: never
    }
  | {
      kind: 'error'
      textError: string
      onTextChange: (text: string) => void
      onTextBlur: () => void
      onSend: () => void
      message: string
    }
  | {
      kind: 'success'
      textError: string
      onTextChange: (text: string) => void
      onTextBlur: () => void
      onSend: () => void
      message?: never
    }
  | {
      kind: 'pending'
      textError?: never
      onTextChange?: never
      onTextBlur?: never
      onSend?: never
      message?: never
    }
)

export function MessageComposer(props: MessageComposerProps) {
  const { input, onSubmit, error, status } = formControls(props)
  return (
    <form
      aria-label="Send message"
      noValidate
      className="grid justify-items-start gap-4 wrap-anywhere"
      onSubmit={onSubmit}
    >
      <Field data-invalid={error !== ''}>
        <FieldLabel htmlFor="conversation-message">Message</FieldLabel>
        <Input
          {...input}
          id="conversation-message"
          name="message"
          required
          maxLength={messageLimit}
          value={props.text}
          aria-invalid={error !== ''}
          aria-describedby={
            error !== '' ? 'conversation-message-error' : undefined
          }
        />
        {error !== '' && (
          <FieldError id="conversation-message-error">{error}</FieldError>
        )}
      </Field>
      <Button
        type="submit"
        disabled={props.kind === 'pending'}
        aria-busy={props.kind === 'pending'}
      >
        Send message
      </Button>
      {props.kind === 'error' && <p role="alert">{props.message}</p>}
      <output>{status}</output>
    </form>
  )
}

function formControls(props: MessageComposerProps) {
  switch (props.kind) {
    case 'pending':
      return {
        input: { readOnly: true },
        onSubmit: (event: SubmitEvent<HTMLFormElement>) => {
          event.preventDefault()
        },
        error: '',
        status: 'Sending message…',
      }
    case 'ready':
    case 'error':
    case 'success':
      return {
        input: {
          onChange: (event: ChangeEvent<HTMLInputElement>) => {
            props.onTextChange(event.target.value)
          },
          onBlur: props.onTextBlur,
        },
        onSubmit: (event: SubmitEvent<HTMLFormElement>) => {
          event.preventDefault()
          props.onSend()
        },
        error: props.textError,
        status: props.kind === 'success' ? 'Message sent.' : '',
      }
  }
}
