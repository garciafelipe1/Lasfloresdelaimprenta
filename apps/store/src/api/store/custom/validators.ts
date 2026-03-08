import { z } from "zod";
import { CATEGORIES, LEGACY_CATEGORIES, sortOptionValues } from "../../../shared/constants";

const categoriesList = [
  ...Object.values(CATEGORIES),
  ...Object.values(LEGACY_CATEGORIES),
] as [string, ...string[]];
const categoriesSet = new Set(categoriesList);

export const GetStoreCustomSchema = z.object({
  q: z.string().optional(),
  order: z.enum(sortOptionValues as [string, ...string[]]).optional(),
  category: z
    .string()
    .optional()
    .transform((val) => {
      const trimmed = typeof val === "string" ? val.trim() : "";
      if (!trimmed) return undefined;
      return categoriesSet.has(trimmed) ? trimmed : undefined;
    }),
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
