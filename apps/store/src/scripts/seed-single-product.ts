import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createProductsWorkflow, createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows";
import { ProductStatus } from "@medusajs/framework/utils";
import slugify from "slugify";

import { SIZES, CATEGORIES } from "@/shared/constants";

export default async function seedSingleProduct({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);

  logger.info("Getting existing data...");

  // Obtener categorías existentes
  const { data: existingCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
  });

  // Verificar si la categoría "Día de la Mujer" existe, si no, crearla
  let categories = (existingCategories || []) as any[];
  const diaMadreCategory = categories.find((c: any) => c.name === CATEGORIES.sanValentin);

  if (!diaMadreCategory) {
    logger.info(`Category "${CATEGORIES.sanValentin}" not found. Creating it...`);
    const { result: categoryResult } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: [
          {
            name: CATEGORIES.sanValentin,
            is_active: true,
          },
        ],
      },
    });
    categories = [...categories, ...(categoryResult as any[])];
    logger.info(`✅ Category "${CATEGORIES.sanValentin}" created.`);
  }

  // Obtener shipping profile existente
  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });

  if (!shippingProfiles || shippingProfiles.length === 0) {
    throw new Error("No shipping profile found. Please run the full seed first.");
  }

  // Obtener sales channel
  const defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  if (!defaultSalesChannel.length) {
    throw new Error("No sales channel found. Please run the full seed first.");
  }

  logger.info("Este script necesita actualizarse para usar productos de Día de la Mujer.");
  logger.info("Por favor, usa el seed principal o crea productos manualmente.");
  return;
}
