import { z } from "zod";

export const PutMembershipSchema = z.object({
  id: z.string(),
  price: z.coerce.number().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
});

export type PutMembershipSchemaType = z.infer<typeof PutMembershipSchema>;
