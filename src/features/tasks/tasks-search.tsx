import { useForm } from '@tanstack/react-form'
import { useCallback, useRef, useState } from 'react'
import type { RefCallback } from 'react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { searchTextSchema } from '@/features/tasks/tasks-search-schema'

const searchSchema = z.object({
  search: searchTextSchema,
})

export type TasksSearchProps = {
  search: string
  onSearch: (search: string) => void
}

export function TasksSearch({ search, onSearch }: TasksSearchProps) {
  const restoreFocus = useRef(false)
  // Committed search resets Form; preserve existing keyboard focus across its remount.
  const inputRef = useCallback((input: HTMLInputElement | null) => {
    if (input === null) {
      return
    }
    if (restoreFocus.current) {
      input.focus({ preventScroll: true })
    }
    return () => {
      restoreFocus.current = document.activeElement === input
    }
  }, [])

  return (
    <SearchForm
      key={search}
      search={search}
      onSearch={onSearch}
      inputRef={inputRef}
    />
  )
}

type SearchFormProps = TasksSearchProps & {
  inputRef: RefCallback<HTMLInputElement>
}

function SearchForm({ search, onSearch, inputRef }: SearchFormProps) {
  const [failure, setFailure] = useState<string | undefined>()
  const form = useForm({
    defaultValues: { search },
    validators: { onSubmit: searchSchema },
    onSubmit: ({ value }) => {
      onSearch(searchSchema.parse(value).search)
    },
  })

  return (
    <search aria-label="Tasks">
      <form
        className="space-y-3"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          setFailure(undefined)
          form.handleSubmit().catch(() => {
            setFailure('Search could not finish. Please try again.')
          })
        }}
      >
        <form.Field name="search">
          {(field) => {
            const invalid = !field.state.meta.isValid
            return (
              <Field data-invalid={invalid}>
                <FieldLabel htmlFor="task-search">Search tasks</FieldLabel>
                <Input
                  ref={inputRef}
                  id="task-search"
                  name={field.name}
                  type="search"
                  value={field.state.value}
                  onChange={(event) => {
                    field.handleChange(event.target.value)
                    setFailure(undefined)
                  }}
                  onBlur={field.handleBlur}
                  aria-invalid={invalid}
                  aria-describedby={invalid ? 'task-search-error' : undefined}
                />
                {invalid && (
                  <FieldError
                    id="task-search-error"
                    errors={field.state.meta.errors}
                  />
                )}
              </Field>
            )
          }}
        </form.Field>
        <Button type="submit">Search</Button>
        {failure !== undefined && <p role="alert">{failure}</p>}
      </form>
    </search>
  )
}
