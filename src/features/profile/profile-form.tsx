import { revalidateLogic, useForm } from '@tanstack/react-form'
import { useState } from 'react'

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { profileSchema } from '@/features/profile/profile-schema'
import {
  ProfileSubmission,
  type ProfileSubmissionProps,
} from '@/features/profile/profile-submission'

export function ProfileForm() {
  const [feedback, setFeedback] = useState<
    Exclude<ProfileSubmissionProps, { kind: 'pending' }>
  >({ kind: 'idle' })
  const form = useForm({
    defaultValues: { displayName: '', email: '' },
    validationLogic: revalidateLogic({
      mode: 'blur',
      modeAfterSubmission: 'change',
    }),
    validators: { onDynamic: profileSchema },
    onSubmit: ({ value }) => {
      // Standard Schema validation does not apply Zod transforms to form values.
      const profile = profileSchema.parse(value)
      setFeedback({ kind: 'success', displayName: profile.displayName })
    },
  })

  return (
    <form
      aria-label="Profile"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        setFeedback({ kind: 'idle' })
        form.handleSubmit().catch(() => {
          setFeedback({
            kind: 'error',
            message: 'Validation could not finish. Please try again.',
          })
        })
      }}
    >
      <FieldGroup>
        <form.Field name="displayName">
          {(field) => {
            const invalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={invalid}>
                <FieldLabel htmlFor="displayName">Display name</FieldLabel>
                <Input
                  id="displayName"
                  name={field.name}
                  autoComplete="name"
                  required
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    field.handleChange(event.target.value)
                    setFeedback({ kind: 'idle' })
                  }}
                  aria-invalid={invalid}
                  aria-describedby={invalid ? 'displayName-error' : undefined}
                />
                {invalid && (
                  <FieldError
                    id="displayName-error"
                    errors={field.state.meta.errors}
                  />
                )}
              </Field>
            )
          }}
        </form.Field>
        <form.Field name="email">
          {(field) => {
            const invalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={invalid}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name={field.name}
                  type="email"
                  autoComplete="email"
                  required
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    field.handleChange(event.target.value)
                    setFeedback({ kind: 'idle' })
                  }}
                  aria-invalid={invalid}
                  aria-describedby={invalid ? 'email-error' : undefined}
                />
                {invalid && (
                  <FieldError
                    id="email-error"
                    errors={field.state.meta.errors}
                  />
                )}
              </Field>
            )
          }}
        </form.Field>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <ProfileSubmission
              {...(isSubmitting ? { kind: 'pending' } : feedback)}
            />
          )}
        </form.Subscribe>
      </FieldGroup>
    </form>
  )
}
