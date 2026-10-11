import { z } from 'zod'

export const searchTextSchema = z
  .string()
  .trim()
  .max(100, 'Use 100 characters or fewer.')
