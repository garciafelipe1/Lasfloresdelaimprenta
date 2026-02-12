import { InputConfigModules } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  defineConfig,
  loadEnv,
  Modules,
} from "@medusajs/framework/utils";
import path from "path";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

const redisModules: InputConfigModules = [];

const redisUrl = (process.env.REDIS_URL || "").trim();
const shouldUseRedis = process.env.NODE_ENV === "production" && redisUrl.length > 0;

if (process.env.NODE_ENV === "production" && !shouldUseRedis) {
  // eslint-disable-next-line no-console
  console.warn(
    "[medusa-config] NODE_ENV=production pero falta REDIS_URL. Se usará in-memory (no recomendado para producción)."
  );
}

if (shouldUseRedis) {
  redisModules.push(
    {
      resolve: "@medusajs/medusa/cache-redis",
      options: { redisUrl },
    },
    {
      resolve: "@medusajs/medusa/event-bus-redis",
      options: { redisUrl },
    },
    {
      resolve: "@medusajs/medusa/workflow-engine-redis",
      options: { redis: { url: redisUrl } },
    }
  );
}

module.exports = defineConfig({
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    backendUrl: process.env.MEDUSA_BACKEND_URL,
    vite: () => ({
      resolve: {
        alias: {
          "~": path.resolve(__dirname, "./src/admin"),
        },
      },
    }),
  },

  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: shouldUseRedis ? redisUrl : "",
    http: {
      storeCors: process.env.STORE_CORS || "",
      adminCors: process.env.ADMIN_CORS || "",
      authCors: process.env.AUTH_CORS || "",
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
    workerMode: process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server",
  },

  plugins: [
    {
      resolve: `@nicogorga/medusa-payment-mercadopago`,
      options: {
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
        webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
      },
    },
  ],

  modules: [
    ...redisModules,

    // File: Cloudflare R2 (S3-compatible). Reemplaza el file-local por defecto.
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/file-s3",
            id: "r2",
            options: {
              bucket: process.env.S3_BUCKET,
              region: process.env.S3_REGION || "auto",
              endpoint: process.env.S3_ENDPOINT,
              access_key_id: process.env.S3_ACCESS_KEY,
              secret_access_key: process.env.S3_SECRET_KEY,
              // URL pública para que Medusa guarde URLs que el frontend pueda cargar (evita "undefined/KEY").
              // En Railway: S3_PUBLIC_URL = https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev
              url: process.env.S3_PUBLIC_URL,
            },
          },
        ],
      },
    },

    // ❌ NOTIFICATION REMOVIDO (NO RESEND)
    // {
    //   resolve: "@medusajs/medusa/notification",
    //   options: {
    //     providers: [
    //       {
    //         resolve: "./src/modules/resend",
    //         id: "resend",
    //         options: {
    //           channels: ["email"],
    //           api_key: process.env.RESEND_API_KEY,
    //           from: process.env.RESEND_FROM_EMAIL,
    //         },
    //       },
    //     ],
    //   },
    // },

    {
      resolve: "@medusajs/medusa/auth",
      dependencies: [Modules.CACHE, ContainerRegistrationKeys.LOGGER],
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/auth-google",
            id: "google",
            options: {
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
              callbackUrl: process.env.GOOGLE_CALLBACK_URL,
            },
          },
          {
            resolve: "@medusajs/medusa/auth-emailpass",
            id: "emailpass",
            dependencies: [Modules.CACHE, ContainerRegistrationKeys.LOGGER],
          },
        ],
      },
    },

    {
      resolve: "./src/modules/membership",
    },

    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve:
              "@nicogorga/medusa-payment-mercadopago/providers/mercado-pago",
            id: "mercadopago",
            options: {
              accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
              webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
            },
            dependencies: [ContainerRegistrationKeys.LOGGER],
          },
        ],
      },
    },
  ],
});
