import { z } from "zod";

export const MercadoPagoWebhookSchema = z.object({
  type: z.string(),
  action: z.string().optional(),
  data: z.object({
    id: z.string(),
  }),
  date_created: z.string().optional(),
  id: z.number().optional(),
  live_mode: z.boolean().optional(),
  user_id: z.string().optional(),
});

export type MercadoPagoWebhookSchemaType = z.infer<
  typeof MercadoPagoWebhookSchema
>;

