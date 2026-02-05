import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows";

import { CATEGORIES } from "@/shared/constants";
import { SeedProducts } from "./seed-products";

/**
 * Seed SOLO de productos (no regiones).
 *
 * Re-ejecutable: salta productos que ya existen por handle.
 *
 * Ejecutar:
 * pnpm seed:products
 */
export default async function seedProductsOnly({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);

  logger.info("Seeding products (sin tocar regiones)...");

  // Categories existentes
  const { data: existingCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
  });

  const categories = (existingCategories || []) as any[];
  const wanted = new Set(Object.values(CATEGORIES));
  const existing = new Set(categories.map((c: any) => c.name));
  const missing = [...wanted].filter((name) => !existing.has(name));

  let finalCategories: any[] = categories;
  if (missing.length) {
    const { result: created } = await createProductCategoriesWorkflow(
      container
    ).run({
      input: {
        product_categories: missing.map((name) => ({
          name,
          is_active: true,
        })),
      },
    });
    finalCategories = [...categories, ...(created as any[])];
  }

  // Shipping profile existente (requerido)
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });
  const shippingProfile = shippingProfiles[0];
  if (!shippingProfile) {
    throw new Error(
      'No se encontró "Default Shipping Profile". Corré el seed completo una vez en una DB vacía o crealo manualmente.'
    );
  }

  // Sales channel existente (requerido)
  const defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });
  if (!defaultSalesChannel.length) {
    throw new Error(
      'No se encontró "Default Sales Channel". Crealo primero en el admin.'
    );
  }

  await SeedProducts(
    container,
    finalCategories as any,
    shippingProfile.id,
    defaultSalesChannel[0].id
  );

  logger.info("✅ Finished seeding products.");
}

