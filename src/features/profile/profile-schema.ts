import { z } from 'zod'

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Use at least 2 characters.')
    .max(50, 'Use 50 characters or fewer.'),
  email: z.email('Enter a valid email address.'),
})
