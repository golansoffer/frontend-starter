import { z } from 'zod'

const environmentSchema = z.object({
  VITE_APP_NAME: z.string().trim().min(1).default('Frontend starter'),
})

export const env = environmentSchema.parse(import.meta.env)
