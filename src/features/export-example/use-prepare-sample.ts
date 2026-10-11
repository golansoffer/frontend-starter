import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'

import type { AsyncButtonProps } from '@/features/export-example/async-button'
import { requestSample } from '@/features/export-example/sample-request'

const receiptSchema = z
  .object({
    file_name: z.string().trim().min(1),
    row_count: z.number().int().nonnegative(),
  })
  .transform((receipt) => ({
    fileName: receipt.file_name,
    rowCount: receipt.row_count,
  }))

export function usePrepareSample(): AsyncButtonProps {
  const preparation = useMutation({
    networkMode: 'always',
    mutationFn: async () => receiptSchema.parse(await requestSample()),
  })
  const prepareSample = () => {
    preparation.mutate()
  }

  switch (preparation.status) {
    case 'idle':
      return { kind: 'ready', onClick: prepareSample }
    case 'pending':
      return { kind: 'pending' }
    case 'error':
      return {
        kind: 'error',
        message: 'Could not prepare the sample. Please try again.',
        onClick: prepareSample,
      }
    case 'success':
      return {
        kind: 'success',
        message: `${preparation.data.fileName}: ${String(preparation.data.rowCount)} rows ready.`,
      }
  }
}
