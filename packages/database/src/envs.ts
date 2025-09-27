import "dotenv/config";
import { z } from "zod";

const envsSchema = z.object({
  DB_URL: z.string().url(),
  SEED: z.coerce.boolean(),
});

export default envsSchema.parse({
  DB_URL: process.env.DATABASE_URL,
  SEED: process.env.SEED ?? false,
});
