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
  let data: unknown
  try {
    const response = await fetch(url, {
      signal,
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) {
      throw new HttpError(response.status)
    }
    data = await response.json()
  } catch (error) {
    if (!signal.aborted && error instanceof TypeError) {
      throw new NetworkError(error)
    }
    throw error
  }
  return schema.parse(data)
}
