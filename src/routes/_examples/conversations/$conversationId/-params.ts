import { z } from 'zod'

import { conversationIdSchema } from '@/features/conversations/conversation-schema'

export const conversationParamsSchema = z.object({
  conversationId: conversationIdSchema,
})
