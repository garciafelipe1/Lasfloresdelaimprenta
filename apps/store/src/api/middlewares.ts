import { stableStringify } from "@/lib/stable-stringify";
import {
  authenticate,
  defineMiddlewares,
  type MedusaNextFunction,
  type MedusaRequest,
  type MedusaResponse,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http";
import {
  ConfigModule,
  StoreProductListResponse,
} from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  parseCorsOrigins,
} from "@medusajs/framework/utils";
import cors from "cors";
import { createShippingOptionSchema } from "../shared/dtos/shipping-options";
import { webhookSubscriptionSchema } from "./membership/subscription/validators";
import { PutMembershipSchema } from "./membership/validators";
import { GetStoreCustomSchema } from "./store/custom/validators";
import { ConfirmMercadoPagoPaymentSchema } from "./store/mercadopago/payment/validators";
import { MercadoPagoWebhookSchema } from "./store/mercadopago/webhook/validators";

export default defineMiddlewares({
  routes: [
    // Cities
    {
      matcher: "/bahia-blanca/city",
      method: "POST",
      middlewares: [validateAndTransformBody(createShippingOptionSchema)],
    },
    // Membership
    {
      matcher: "/membership",
      method: "PUT",
      middlewares: [validateAndTransformBody(PutMembershipSchema)],
    },
    {
      matcher: "/membership/subscription",
      method: "POST",
      middlewares: [validateAndTransformBody(webhookSubscriptionSchema)],
    },
    // MercadoPago payment endpoints
    {
      matcher: "/store/mercadopago/payment",
      method: "POST",
      middlewares: [validateAndTransformBody(ConfirmMercadoPagoPaymentSchema)],
    },
    {
      matcher: "/store/mercadopago/webhook",
      method: "POST",
      middlewares: [validateAndTransformBody(MercadoPagoWebhookSchema)],
    },
    {
      matcher: "/membership/subscription/me",
      method: "GET",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/google/*",
      middlewares: [
        (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
          const configModule: ConfigModule = req.scope.resolve("configModule");
          return cors({
            origin: parseCorsOrigins(configModule.projectConfig.http.storeCors),
            credentials: true,
          })(req, res, next);
        },
      ],
    },
    {
      matcher: "/store/products", // ℹ️ The core API route we want to cache
      method: "GET",
      middlewares: [
        async (
          req: MedusaRequest,
          res: MedusaResponse,
          next: MedusaNextFunction
        ) => {
          const cacheModule = req.scope.resolve(Modules.CACHE);

          // ℹ️ This is the part responsible for retrieving the products from the cache
          const queryKey = JSON.stringify(req.query);
          const cacheKey = `medusa:products:${queryKey}`;

          const cachedProducts =
            await cacheModule.get<StoreProductListResponse>(cacheKey);

          if (cachedProducts) {
            console.log("LEYENDO CACHE");
            res.json(cachedProducts);
            return;
          }

          // ℹ️ This is the part responsible for caching the products after they are retrieved from the database
          const originalJsonFn = res.json;
          Object.assign(res, {
            json: async function (body: StoreProductListResponse) {
              await cacheModule.set(cacheKey, body);
              await originalJsonFn.call(res, body);
            },
          });

          console.log("LEYENDO BASE DE DATOS");
          next();
        },
      ],
    },
    {
      matcher: "/store/custom/*",
      middlewares: [
        (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
          const configModule: ConfigModule = req.scope.resolve("configModule");
          return cors({
            origin: parseCorsOrigins(configModule.projectConfig.http.storeCors),
            credentials: true,
          })(req, res, next);
        },
      ],
    },
    {
      matcher: "/store/custom",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetStoreCustomSchema, {}),
        async (
          req: MedusaRequest,
          res: MedusaResponse,
          next: MedusaNextFunction
        ) => {
          const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
          const cacheService = req.scope.resolve(Modules.CACHE);

          const queryParams = req.validatedQuery;

          const CACHE_KEY = `medusa:products:custom:${stableStringify(
            queryParams
          )}`;

          logger.info(`Caching custom products with key: ${CACHE_KEY}`);

          // ℹ️ First, we check if the data is cached
          const cached = await cacheService.get<{ output: any[] }>(CACHE_KEY);

          // ℹ️ If the data is cached, we return it immediately
          if (cached?.output) {
            logger.info("LEYENDO CACHE ENDPOINT CUSTOM");
            return res.json(cached.output);
          }

          logger.info("LEYENDO BASE DE DATOS ENDPOINT CUSTOM");
          next();
        },
      ],
    },
    // {
    //   matcher: "/store/carts/*",
    //   method: "GET",
    //   middlewares: [cacheCartEndpoint],
    // },
    // {
    //   matcher: "/store/carts/*",
    //   method: ["DELETE", "PUT", "POST", "PATCH"],
    //   middlewares: [invalidateCartCache],
    // },
  ],
});
