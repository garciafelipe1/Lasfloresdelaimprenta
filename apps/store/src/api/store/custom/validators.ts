import { z } from "zod";
import { CATEGORIES, sortOptionValues } from "../../../shared/constants";

const categories = Object.values(CATEGORIES) as [string, ...string[]];

export const GetStoreCustomSchema = z.object({
  q: z.string().optional(),
  order: z.enum(sortOptionValues as [string, ...string[]]).optional(),
  category: z
    .string()
    .optional()
    .transform((val) =>
      val && categories.includes(val) ? val : undefined
    ),
  color: z.string().optional(),
  min_price: z.preprocess((val) => {
    if (val && typeof val === "string") {
      return parseInt(val);
    }
    return val;
  }, z.number().optional()),
  max_price: z.preprocess((val) => {
    if (val && typeof val === "string") {
      return parseInt(val);
    }
    return val;
  }, z.number().optional()),
  page: z.preprocess((val) => {
    if (val && typeof val === "string") {
      return parseInt(val);
    }
    return val;
  }, z.number().optional()),
  currency_code: z.string(),
  region_id: z.string(),
});

export type GetStoreCustomSchemaType = z.infer<typeof GetStoreCustomSchema>;
