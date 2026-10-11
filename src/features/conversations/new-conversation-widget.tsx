import type { ChangeEvent, SubmitEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { titleLimit } from '@/features/conversations/conversation-schema'

export type NewConversationWidgetProps = { title: string } & (
  | {
      kind: 'ready'
      titleError: string
      onTitleChange: (title: string) => void
      onTitleBlur: () => void
      onCreate: () => void
      message?: never
    }
  | {
      kind: 'error'
      titleError: string
      onTitleChange: (title: string) => void
      onTitleBlur: () => void
      onCreate: () => void
      message: string
    }
  | {
      kind: 'pending'
      titleError?: never
      onTitleChange?: never
      onTitleBlur?: never
      onCreate?: never
      message?: never
    }
  | {
      kind: 'success'
      titleError?: never
      onTitleChange?: never
      onTitleBlur?: never
      onCreate?: never
      message?: never
    }
)

export function NewConversationWidget(props: NewConversationWidgetProps) {
  const { input, onSubmit, error, status } = formControls(props)
  return (
    <form
      aria-label="New conversation"
      noValidate
      className="grid justify-items-start gap-4 wrap-anywhere"
      onSubmit={onSubmit}
    >
      <Field data-invalid={error !== ''}>
        <FieldLabel htmlFor="conversation-title">Title</FieldLabel>
        <Input
          {...input}
          id="conversation-title"
          name="title"
          required
          maxLength={titleLimit}
          value={props.title}
          aria-invalid={error !== ''}
          aria-describedby={
            error !== '' ? 'conversation-title-error' : undefined
          }
        />
        {error !== '' && (
          <FieldError id="conversation-title-error">{error}</FieldError>
        )}
      </Field>
      <Button
        type="submit"
        disabled={props.kind === 'pending' || props.kind === 'success'}
        aria-busy={props.kind === 'pending'}
      >
        Create conversation
      </Button>
      {props.kind === 'error' && <p role="alert">{props.message}</p>}
      <output>{status}</output>
    </form>
  )
}

function formControls(props: NewConversationWidgetProps) {
  switch (props.kind) {
    case 'pending':
    case 'success':
      return {
        input: { readOnly: true },
        onSubmit: (event: SubmitEvent<HTMLFormElement>) => {
          event.preventDefault()
        },
        error: '',
        status:
          props.kind === 'pending'
            ? 'Creating conversation…'
            : `Created ${props.title}.`,
      }
    case 'ready':
    case 'error':
      return {
        input: {
          onChange: (event: ChangeEvent<HTMLInputElement>) => {
            props.onTitleChange(event.target.value)
          },
          onBlur: props.onTitleBlur,
        },
        onSubmit: (event: SubmitEvent<HTMLFormElement>) => {
          event.preventDefault()
          props.onCreate()
        },
        error: props.titleError,
        status: '',
      }
  }
}
