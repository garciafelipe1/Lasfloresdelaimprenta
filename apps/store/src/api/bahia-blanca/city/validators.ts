import { z } from "zod";

export const PostCitySchema = z.object({
  name: z.string(),
  shipping_price: z.coerce.number(),
});

export type PostCitySchemaType = z.infer<typeof PostCitySchema>;
