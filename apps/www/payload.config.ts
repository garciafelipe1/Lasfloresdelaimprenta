import { Media } from '@/collections/Media';
import envs from '@/config/envs';
// import { payloadInit } from '@/db/seed';
import { sqliteAdapter } from '@payloadcms/db-sqlite';
import {
  FixedToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical';
import { s3Storage } from '@payloadcms/storage-s3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildConfig } from 'payload';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      FixedToolbarFeature(),
    ],
  }),
  collections: [Media],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  admin: {
    components: {
      graphics: {
        Logo: './src/app/components/payload/logo#Logo',
      },
      Nav: {
        path: './src/app/components/payload/nav/nav#Nav',
      },
    },
  },
  secret: envs.PAYLOAD_SECRET,
  telemetry: false,
  db: sqliteAdapter({
    client: {
      url: envs.DB_URL,
      authToken: envs.DB_TOKEN,
    },
  }),
  // onInit: payloadInit,
  plugins: [
    s3Storage({
      collections: {
        media: true,
      },
      bucket: envs.S3.BUCKET,
      config: {
        credentials: {
          secretAccessKey: envs.S3.SECRET,
          accessKeyId: envs.S3.KEY_ID,
        },
        endpoint: envs.S3.URL,
        region: 'auto',
      },
      enabled: false,
    }),
  ],
});
