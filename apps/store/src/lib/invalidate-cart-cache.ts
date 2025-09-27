import {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";

export const invalidateCartCache = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const cacheModule = req.scope.resolve(Modules.CACHE);

  const cartId = req.params.id;
  const cacheKey = `medusa:cart:${cartId}`;

  // Store original json function
  const originalJsonFn = res.json;

  Object.assign(res, {
    json: async function (body: any) {
      await cacheModule.invalidate(cacheKey);
      await originalJsonFn.call(res, body);
    },
  });

  next();
};
