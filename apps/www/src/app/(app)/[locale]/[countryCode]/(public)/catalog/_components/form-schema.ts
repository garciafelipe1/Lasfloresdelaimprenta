import { z } from 'zod';

export const filtersFormSchema = z.object({
  name: z.string().optional(),
  order: z.string().optional(),
  category: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  min_price: z.string().optional(),
  max_price: z.string().optional(),
});

export type FiltersFormSchema = z.infer<typeof filtersFormSchema>;
