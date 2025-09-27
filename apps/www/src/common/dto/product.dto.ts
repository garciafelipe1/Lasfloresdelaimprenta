import { z } from 'zod';

export const productDTO = z.object({
  name: z.string(),
  price: z.string(),
  description: z.string(),
  images: z
    .array(
      z.object({
        src: z.string(),
      }),
    )
    .transform((images) => images.map((i) => i.src)),
  id: z.coerce.number(),
});

export type ProductDTO = z.infer<typeof productDTO>;
