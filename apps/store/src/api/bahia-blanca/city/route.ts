import { BAHIA_BLANCA_SHIPPING_CODES } from "@/shared/constants";
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { createShippingOptionsWorkflow } from "@medusajs/medusa/core-flows";
import { CreateShippingOptionsDTO } from "../../../shared/dtos/shipping-options";

export async function POST(
  req: MedusaRequest<CreateShippingOptionsDTO>,
  res: MedusaResponse
) {
  const fulfillmentModuleService = req.scope.resolve(Modules.FULFILLMENT);

  const [serviceZone] = await fulfillmentModuleService.listServiceZones();
  const [shippingProfile] =
    await fulfillmentModuleService.listShippingProfiles();

  const { name, price } = req.validatedBody;

  await createShippingOptionsWorkflow(req.scope).run({
    input: [
      {
        name,
        provider_id: "manual_manual",
        price_type: "flat",
        service_zone_id: serviceZone.id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Standard",
          description: "Ship in 2-3 days.",
          code: BAHIA_BLANCA_SHIPPING_CODES.bahiaBlanca,
        },
        prices: [
          {
            currency_code: "usd",
            amount: 10,
          },
          {
            currency_code: "ars",
            amount: price,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
    ],
  });

  res.json({
    message: "Ciudad agregada correctamente",
  });
}
