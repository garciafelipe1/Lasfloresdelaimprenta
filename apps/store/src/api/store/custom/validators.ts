import { z } from "zod";
import { CATEGORIES, sortOptionValues } from "../../../shared/constants";

const categories = Object.values(CATEGORIES).map((c) => c);

export const GetStoreCustomSchema = z.object({
  q: z.string().optional(),
  order: z.enum(sortOptionValues as [string, ...string[]]).optional(),
  category: z.enum(categories as [string, ...string[]]).optional(),
  color: z.string().optional(),
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
