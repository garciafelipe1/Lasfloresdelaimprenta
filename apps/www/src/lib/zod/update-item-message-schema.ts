import { z } from 'zod';

export const updateItemMessageSchema = z.object({
  message: z.string().optional(),
  itemId: z.string(),
  quantity: z.coerce.number(),
});

export type UpdateItemMessageSchema = z.infer<typeof updateItemMessageSchema>;
