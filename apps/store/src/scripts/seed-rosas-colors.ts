import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createProductsWorkflow } from "@medusajs/medusa/core-flows";
import { ProductStatus } from "@medusajs/framework/utils";
import slugify from "slugify";

import { ROSAS_QUANTITY } from "@/shared/constants";
import { rosas } from "./seed/products/rosas.seed";

export default async function seedRosasColors({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);

  logger.info("Getting existing data...");

  // Obtener categorías existentes
  const { data: existingCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
  });

  const categories = existingCategories || [];
  const rosasCategory = categories.find((c: any) => c.name === "Rosas");
  
  if (!rosasCategory) {
    throw new Error("Category 'Rosas' not found. Please run the full seed first.");
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

  logger.info("Checking existing products...");

  // Filtrar productos que ya existen
  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["handle"],
  });

  const existingHandles = new Set(
    (existingProducts || []).map((p: any) => p.handle)
  );

  // Filtrar solo productos que no existen
  const productsToCreate = rosas.filter((item) => {
    const handle = slugify(item.title, { lower: true, trim: true });
    return !existingHandles.has(handle);
  });

  if (productsToCreate.length === 0) {
    logger.info("All products already exist. Nothing to create.");
    return;
  }

  logger.info(`Creating ${productsToCreate.length} new product(s)...`);

  const buildBasicSeedProduct = (item: any) => {
    return {
      title: item.title,
      description: item.description,
      category_ids: [rosasCategory.id],
      handle: slugify(item.title, { lower: true, trim: true }),
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfiles[0].id,
      images: item.images.map((image: string) => ({ url: image })),
      sales_channels: [{ id: defaultSalesChannel[0].id }],
      metadata: item.metadata || {},
    };
  };

  const products: any[] = productsToCreate.map((i) => ({
    ...buildBasicSeedProduct(i),
    options: [{ title: "Cantidad", values: ROSAS_QUANTITY }],
    variants: ROSAS_QUANTITY.map((cantidad) => ({
      title: `${i.title} / ${cantidad}`,
      sku: `${slugify(i.title, { lower: true, trim: true })}-${cantidad}`,
      options: { Cantidad: cantidad },
      prices: [
        {
          amount: i.price.ars.base * parseInt(cantidad),
          currency_code: "ars",
        },
        {
          amount: i.price.usd.base * parseInt(cantidad),
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
