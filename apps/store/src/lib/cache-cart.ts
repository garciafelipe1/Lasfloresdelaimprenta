import {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { cacheKeys } from "./cache-keys";

export const cacheCartEndpoint = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const cacheModule = req.scope.resolve(Modules.CACHE);
  const cartId = req.params.id;
  const keyPrefix = cacheKeys.cart;

  const cacheKey = `${keyPrefix}:${cartId}`;

  const cachedData = await cacheModule.get(cacheKey);

  if (cachedData) {
    console.log("LEYENDO CACHE PARA ", keyPrefix);
    res.json(cachedData);
    return;
  }

  const originalJsonFn = res.json;
  Object.assign(res, {
    json: async function (body: any) {
      await cacheModule.set(cacheKey, body);
      await originalJsonFn.call(res, body);
    },
  });

  console.log("LEYENDO BASE DE DATOS");
  next();
};
