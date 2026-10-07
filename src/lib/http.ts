import type { z } from 'zod'

export class NetworkError extends Error {
  constructor(cause: TypeError) {
    super('Network request failed.', { cause })
    this.name = 'NetworkError'
  }
}

export class HttpError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`Request failed (${String(status)}).`)
    this.status = status
    this.name = 'HttpError'
  }
}

export async function getJson<T>(
  url: string,
  schema: z.ZodType<T>,
  signal: AbortSignal,
): Promise<T> {
  const response = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  }).catch((error: unknown) => {
    if (!signal.aborted && error instanceof TypeError) {
      throw new NetworkError(error)
    }
    throw error
  })
  if (!response.ok) {
    throw new HttpError(response.status)
  }
  const data: unknown = await response.json()
  return schema.parse(data)
}
