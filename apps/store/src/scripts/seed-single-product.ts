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

  // Verificar si la categoría "Día de la Madre" existe, si no, crearla
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

  logger.info("Este script necesita actualizarse para usar productos de Día de la Madre.");
  logger.info("Por favor, usa el seed principal o crea productos manualmente.");
  return;

  const buildBasicSeedProduct = (item: any) => {
    const category = categories.find((c: any) => c.name === item.category);
    if (!category) {
      throw new Error(`Category "${item.category}" not found.`);
    }

    return {
      title: item.title,
      description: item.description,
      category_ids: [category.id],
      handle: slugify(item.title, { lower: true, trim: true }),
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfiles[0].id,
      images: item.images.map((image: string) => ({ url: image })),
      sales_channels: [{ id: defaultSalesChannel[0].id }],
    };
  };

  const products: any[] = productsToCreate.map((i) => ({
    ...buildBasicSeedProduct(i),
    options: [{ title: "Tamaño", values: SIZES }],
    variants: SIZES.map((size) => ({
      title: `${i.title} / ${size}`,
      sku: `${slugify(i.title, { lower: true, trim: true })}-${size}`,
      options: { Tamaño: size },
      prices: [
        {
          amount: i.price.ars.base + SIZES.indexOf(size) * i.price.ars.aument,
          currency_code: "ars",
        },
        {
          amount: i.price.usd.base + SIZES.indexOf(size) * i.price.usd.aument,
          currency_code: "usd",
        },
      ],
    })),
  }));

  await createProductsWorkflow(container).run({
    input: {
      products,
    },
  });

  const productNames = productsToCreate.map((p) => p.title).join(", ");
  logger.info(`✅ Product(s) created successfully: ${productNames}`);
}
