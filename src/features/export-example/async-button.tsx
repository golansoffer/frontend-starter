import { Button } from '@/components/ui/button'

export type AsyncButtonProps =
  | { kind: 'ready'; onClick: () => void; message?: never }
  | { kind: 'pending'; onClick?: never; message?: never }
  | { kind: 'error'; onClick: () => void; message: string }
  | { kind: 'success'; onClick?: never; message: string }

export function AsyncButton(props: AsyncButtonProps) {
  switch (props.kind) {
    case 'ready':
      return (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={props.onClick}>
            Prepare sample
          </Button>
        </div>
      )
    case 'pending':
      return (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" disabled aria-busy="true">
            Prepare sample
          </Button>
          <output>Preparing sample…</output>
        </div>
      )
    case 'error':
      return (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={props.onClick}>
            Try again
          </Button>
          <p role="alert">{props.message}</p>
        </div>
      )
    case 'success':
      return (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" disabled>
            Sample ready
          </Button>
          <output>{props.message}</output>
        </div>
      )
  }
}
