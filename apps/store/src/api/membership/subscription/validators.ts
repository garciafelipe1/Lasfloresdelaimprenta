import { z } from "zod";

export const webhookSubscriptionSchema = z.object({
  action: z.string(),
  application_id: z.number(),
  data: z.object({
    id: z.string(),
  }),
  date: z.string(),
  entity: z.string(),
  id: z.number(),
  type: z.string(),
  version: z.number(),
});

export type WebhookSubscriptionSchemaType = z.infer<
  typeof webhookSubscriptionSchema
>;
