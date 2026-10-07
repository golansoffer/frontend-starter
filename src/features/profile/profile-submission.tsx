import { Button } from '@/components/ui/button'

export type ProfileSubmissionProps =
  | { kind: 'idle'; displayName?: never; message?: never }
  | { kind: 'pending'; displayName?: never; message?: never }
  | { kind: 'success'; displayName: string; message?: never }
  | { kind: 'error'; message: string; displayName?: never }

export function ProfileSubmission(props: ProfileSubmissionProps) {
  const pending = props.kind === 'pending'
  return (
    <>
      <Button type="submit" disabled={pending} aria-busy={pending}>
        Validate profile
      </Button>
      <output className="text-sm text-muted-foreground">
        {submissionMessage(props)}
      </output>
    </>
  )
}

function submissionMessage(props: ProfileSubmissionProps) {
  switch (props.kind) {
    case 'idle':
      return ''
    case 'pending':
      return 'Validating profile…'
    case 'success':
      return `Validated profile for ${props.displayName}. Nothing was sent or saved.`
    case 'error':
      return props.message
  }
}
