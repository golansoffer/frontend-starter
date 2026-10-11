import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'

import { AsyncButton } from '@/features/export-example/async-button'
import * as sampleRequest from '@/features/export-example/sample-request'
import { usePrepareSample } from '@/features/export-example/use-prepare-sample'
import { createQueryClient } from '@/lib/query-client'

function Sample() {
  const props = usePrepareSample()
  return <AsyncButton {...props} />
}

it('derives the pending and successful views from the request and adapts its receipt', async () => {
  const user = userEvent.setup()
  const completeRequest = vi.fn<(receipt: unknown) => void>()
  const response = new Promise<unknown>((resolve) => {
    completeRequest.mockImplementation(resolve)
  })
  const request = vi
    .spyOn(sampleRequest, 'requestSample')
    .mockReturnValue(response)
  const client = createQueryClient()
  render(
    <QueryClientProvider client={client}>
      <Sample />
    </QueryClientProvider>,
  )
  await user.click(screen.getByRole('button', { name: 'Prepare sample' }))
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Preparing sample…',
  )
  expect(screen.getByRole('button', { name: 'Prepare sample' })).toBeDisabled()
  await user.click(screen.getByRole('button', { name: 'Prepare sample' }))
  expect(request).toHaveBeenCalledOnce()

  completeRequest({ file_name: ' sample.csv ', row_count: 3 })
  expect(await screen.findByText('sample.csv: 3 rows ready.')).toBeVisible()
  expect(screen.getByRole('button', { name: 'Sample ready' })).toBeDisabled()
  expect(request).toHaveBeenCalledOnce()
  client.clear()
})

it('reports a failed request and allows a deliberate retry without automatic retries', async () => {
  const user = userEvent.setup()
  const request = vi
    .spyOn(sampleRequest, 'requestSample')
    .mockRejectedValueOnce(new Error('Offline'))
  const client = createQueryClient()
  render(
    <QueryClientProvider client={client}>
      <Sample />
    </QueryClientProvider>,
  )
  await user.click(screen.getByRole('button', { name: 'Prepare sample' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Could not prepare the sample. Please try again.',
  )
  expect(request).toHaveBeenCalledOnce()
  await user.click(screen.getByRole('button', { name: 'Try again' }))
  expect(await screen.findByText('sample.csv: 3 rows ready.')).toBeVisible()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(request).toHaveBeenCalledTimes(2)
  client.clear()
})

it.each([
  { file_name: '', row_count: 3 },
  { file_name: 'sample.csv', row_count: -1 },
  { file_name: 'sample.csv', row_count: 1.5 },
  { fileName: 'sample.csv', rowCount: 3 },
])('rejects invalid receipt data: %j', async (receipt) => {
  const user = userEvent.setup()
  const request = vi
    .spyOn(sampleRequest, 'requestSample')
    .mockResolvedValue(receipt)
  const client = createQueryClient()
  render(
    <QueryClientProvider client={client}>
      <Sample />
    </QueryClientProvider>,
  )
  await user.click(screen.getByRole('button', { name: 'Prepare sample' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Could not prepare the sample. Please try again.',
  )
  expect(
    screen.queryByRole('button', { name: 'Sample ready' }),
  ).not.toBeInTheDocument()
  expect(request).toHaveBeenCalledOnce()
  client.clear()
})
