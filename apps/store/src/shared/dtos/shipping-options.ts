import { z } from "zod";

export const shippingOptionsDto = z.object({
  id: z.string(),
  name: z.string(),
  price: z.coerce.number(),
  priceId: z.string(),
});

export type ShippingOptionsDTO = z.infer<typeof shippingOptionsDto>;

export const createShippingOptionSchema = shippingOptionsDto.pick({
  name: true,
  price: true,
});

export type CreateShippingOptionsDTO = z.infer<
  typeof createShippingOptionSchema
>;

export const updateShippingOptionSchema = shippingOptionsDto.omit({
  priceId: true,
  id: true,
});

export type UpdateShippingOptionDTO = z.infer<
  typeof updateShippingOptionSchema
>;
