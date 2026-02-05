import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createProductsWorkflow } from "@medusajs/medusa/core-flows";
import { ProductStatus } from "@medusajs/framework/utils";
import slugify from "slugify";

import { CATEGORIES } from "@/shared/constants";
import { rosas } from "./seed/products/rosas.seed";

type DesiredTitle =
  | "Golden Era (La Era Dorada)"
  | "Blush Femn"
  | "Pure Essence (Esencia Pura)"
  | "Mystic Transition"
  | "Architecture of Love";

/**
 * Actualiza precios y descripciones de ROSAS IMPORTADAS (2026).
 * Para garantizar precios, borra y recrea estos 5 productos con un solo variant fijo.
 *
 * Importante: NO agrega precios en la descripción (solo texto + cantidad).
 */
export default async function updateRosasImportadas2026({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);

  const toHandle = (value: string) =>
    slugify(value, { lower: true, trim: true, strict: true });

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

  const rosasCategory = (categories || []).find(
    (c: any) => c.name === CATEGORIES.rosas
  );
  if (!rosasCategory) {
    throw new Error(
      `No existe la categoría "${CATEGORIES.rosas}". Corré seed:products.`
    );
  }

  // Evitar choques de inventory_item SKUs
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

  const TARGET_TITLES: DesiredTitle[] = [
    "Golden Era (La Era Dorada)",
    "Blush Femn",
    "Pure Essence (Esencia Pura)",
    "Mystic Transition",
    "Architecture of Love",
  ];

  const desired = (rosas as any[]).filter((p) =>
    TARGET_TITLES.includes(p.title as DesiredTitle)
  );

  if (desired.length !== TARGET_TITLES.length) {
    const got = new Set(desired.map((d) => d.title));
    const missing = TARGET_TITLES.filter((t) => !got.has(t));
    throw new Error(
      `Faltan productos en rosas.seed.ts: ${missing.join(", ")}`
    );
  }

  logger.info(`Recreando ${desired.length} productos de "Rosas importadas" (2026)...`);

  for (const item of desired) {
    const handle = toHandle(item.title);

    // borrar si existe por handle
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
      category_ids: [rosasCategory.id],
      handle,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      thumbnail: item.images?.[0] ?? null,
      images: (item.images || []).map((url: string) => ({ url })),
      sales_channels: [{ id: defaultSalesChannel[0].id }],
      metadata: item.metadata || {},
      options: [{ title: "Presentación", values: ["Default"] }],
      variants: [
        {
          title: "Default",
          sku: uniqueSku(`${handle}-default`),
          options: { Presentación: "Default" },
          prices: [
            { amount: item.price.ars.base, currency_code: "ars" },
            { amount: item.price.usd.base, currency_code: "usd" },
          ],
        },
      ],
    };

    await createProductsWorkflow(container).run({
      input: {
        products: [productData],
      },
    });

    logger.info(`✅ Creado: ${item.title} ($${item.price.ars.base})`);
  }

  logger.info("✅ Rosas importadas 2026 actualizadas.");
}

