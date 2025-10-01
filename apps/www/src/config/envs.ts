import 'dotenv/config';
import { z } from 'zod';

const envsSchema = z.object({
  DB_URL: z.string().url(),
  DB_TOKEN: z.string(),
  SEED: z.coerce.boolean().default(false),
  MERCADO_PAGO: z.object({
    TOKEN: z.string(),
  }),
  APP_URL: z.string(),
  S3: z.object({
    URL: z.string(),
    BUCKET: z.string(),
    KEY_ID: z.string(),
    SECRET: z.string(),
  }),
  GOOGLE: z.object({
    CLIENT_ID: z.string(),
    CLIENT_SECRET: z.string(),
  }),
  MEDUSA_BACKEND_URL: z.string().url(),
  DEFAULT_REGION: z.string(),
  PAYLOAD_SECRET: z.string(),
});

export default envsSchema.parse({
  DB_URL: process.env.DB_URL,
  DB_TOKEN: process.env.DATABASE_AUTH_TOKEN,
  SEED: process.env.SEED,
  MERCADO_PAGO: {
    TOKEN: process.env.MP_ACCESS_TOKEN,
  },
  APP_URL: process.env.APP_URL,
  S3: {
    URL: process.env.S3_URL,
    BUCKET: process.env.S3_BUCKET,
    KEY_ID: process.env.S3_KEY_ID,
    SECRET: process.env.S3_SECRET,
  },
  GOOGLE: {
    CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  },
  MEDUSA_BACKEND_URL: process.env.MEDUSA_BACKEND_URL,
  DEFAULT_REGION: process.env.DEFAULT_REGION || 'ar',
  PAYLOAD_SECRET: process.env.PAYLOAD_SECRET || 'supersecret',
});
