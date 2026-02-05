import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createProductsWorkflow } from "@medusajs/medusa/core-flows";
import { ProductStatus } from "@medusajs/framework/utils";
import slugify from "slugify";

import { CATEGORIES, SIZES } from "@/shared/constants";
import { sanValentin } from "./seed/products/san-valentin.seed";

/**
 * Actualiza precios de San Valentín en la DB:
 * - Borra y recrea los productos de `sanValentin.seed.ts` para asegurar precios de variantes.
 *
 * Nota: lo hacemos así porque los precios viven a nivel variante y no hay un helper
 * simple en este repo para update in-place.
 */
export default async function updateSanValentinPrices({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);

  const toHandle = (value: string) =>
    slugify(value, { lower: true, trim: true, strict: true });

  // Requeridos para crear productos
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });
  const shippingProfile = shippingProfiles[0];
  if (!shippingProfile) {
    throw new Error('No se encontró "Default Shipping Profile".');
  }

  const defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });
  if (!defaultSalesChannel.length) {
    throw new Error('No se encontró "Default Sales Channel".');
  }

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
  });

  const svCategory = (categories || []).find(
    (c: any) => c.name === CATEGORIES.sanValentin
  );
  if (!svCategory) {
    throw new Error(`No existe la categoría "${CATEGORIES.sanValentin}". Corré seed:products.`);
  }

  // Evitar choques de inventario (los inventory_items suelen quedar aunque borres productos)
  const { data: existingInventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["sku"],
  });

  const reservedSkus = new Set<string>(
    (existingInventoryItems || [])
      .map((i: any) => i?.sku)
      .filter((sku: any) => typeof sku === "string" && sku.length)
  );

  const uniqueSku = (preferredSku: string) => {
    if (!reservedSkus.has(preferredSku)) {
      reservedSkus.add(preferredSku);
      return preferredSku;
    }

    let i = 2;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const candidate = `${preferredSku}-${i}`;
      if (!reservedSkus.has(candidate)) {
        reservedSkus.add(candidate);
        return candidate;
      }
      i += 1;
    }
  };

  logger.info(`Recreando ${sanValentin.length} productos de San Valentín con nuevos precios...`);

  for (const item of sanValentin as any[]) {
    const handle = toHandle(item.title);

    // Buscar por handle actual
    const { data: existing } = await query.graph({
      entity: "product",
      fields: ["id", "handle"],
      filters: {
        handle: {
          $eq: handle,
        },
      },
    });

    if (existing?.[0]?.id) {
      await productModuleService.deleteProducts([existing[0].id]);
      logger.info(`🗑️  Borrado: ${item.title} (${handle})`);
    }

    const productData = {
      title: item.title,
      description: item.description,
      category_ids: [svCategory.id],
      handle,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      thumbnail: item.images?.[0] ?? null,
      images: (item.images || []).map((url: string) => ({ url })),
      sales_channels: [{ id: defaultSalesChannel[0].id }],
      metadata: item.metadata || {},
      options: [{ title: "Tamaño", values: SIZES }],
      variants: SIZES.map((size) => ({
        title: `${item.title} / ${size}`,
        sku: uniqueSku(`${handle}-${size}`),
        options: { Tamaño: size },
        prices: [
          {
            amount: item.price.ars.base + SIZES.indexOf(size) * item.price.ars.aument,
            currency_code: "ars",
          },
          {
            amount: item.price.usd.base + SIZES.indexOf(size) * item.price.usd.aument,
            currency_code: "usd",
          },
        ],
      })),
    };

    await createProductsWorkflow(container).run({
      input: {
        products: [productData],
      },
    });

    logger.info(`✅ Creado: ${item.title} ($${item.price.ars.base})`);
  }

  logger.info("✅ Precios de San Valentín actualizados.");
}

