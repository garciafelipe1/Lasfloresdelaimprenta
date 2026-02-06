import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createProductsWorkflow } from "@medusajs/medusa/core-flows";
import { ProductStatus } from "@medusajs/framework/utils";
import slugify from "slugify";
import { CATEGORIES } from "@/shared/constants";

/**
 * Actualiza SOLO la categoría "Ramos primaverales":
 * - Reemplaza variaciones actuales por: S, M, L, XL, XXL
 * - Setea precios ARS fijos por tamaño:
 *   S 50.000, M 75.000, L 95.000, XL 135.000, XXL 170.000
 *
 * Estrategia (segura y consistente con scripts existentes):
 * - Para cada producto de la categoría, lo BORRA y lo RECREA con el mismo handle/título/contenido,
 *   pero con nuevas variantes y precios.
 *
 * Nota: esto NO afecta otras categorías.
 */
export default async function updateRamosPrimaveralesSizesPrices({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);

  const SPRING_SIZES = ["S", "M", "L", "XL", "XXL"] as const;
  const ARS: Record<(typeof SPRING_SIZES)[number], number> = {
    S: 50_000,
    M: 75_000,
    L: 95_000,
    XL: 135_000,
    XXL: 170_000,
  };
  const USD: Record<(typeof SPRING_SIZES)[number], number> = {
    S: 50,
    M: 75,
    L: 95,
    XL: 135,
    XXL: 170,
  };

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

  const springCategory = (categories || []).find(
    (c: any) => c.name === CATEGORIES.ramosPrimaverales,
  );
  if (!springCategory) {
    throw new Error(
      `No existe la categoría "${CATEGORIES.ramosPrimaverales}". Corré seed:products.`,
    );
  }

  // Tomar productos existentes en esa categoría
  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "description",
      "thumbnail",
      "images.url",
      "metadata",
      "categories.name",
    ],
  });

  const springProducts = (products || []).filter((p: any) =>
    (p?.categories || []).some(
      (c: any) => c?.name === CATEGORIES.ramosPrimaverales,
    ),
  );

  if (!springProducts.length) {
    logger.info(
      `[update-spring-sizes] No hay productos en "${CATEGORIES.ramosPrimaverales}". Nada para hacer.`,
    );
    return;
  }

  // Evitar colisiones de SKUs a nivel inventory_item (pueden quedar aunque borres productos)
  const { data: existingInventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["sku"],
  });

  const reservedSkus = new Set<string>(
    (existingInventoryItems || [])
      .map((i: any) => i?.sku)
      .filter((sku: any) => typeof sku === "string" && sku.length),
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

  logger.info(
    `[update-spring-sizes] Actualizando ${springProducts.length} producto(s) de "${CATEGORIES.ramosPrimaverales}"...`,
  );

  for (const p of springProducts) {
    const handle = String(p.handle || toHandle(p.title));

    // Borrar producto actual
    await productModuleService.deleteProducts([p.id]);
    logger.info(`[update-spring-sizes] 🗑️  Borrado: ${p.title} (${handle})`);

    // Recrear manteniendo contenido, cambiando SOLO variaciones/precios
    const images = (p.images || [])
      .map((i: any) => i?.url)
      .filter(Boolean)
      .map((url: string) => ({ url }));

    const productData = {
      title: p.title,
      description: p.description,
      category_ids: [springCategory.id],
      handle,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      thumbnail: p.thumbnail ?? (images[0]?.url ?? null),
      images,
      sales_channels: [{ id: defaultSalesChannel[0].id }],
      metadata: p.metadata || {},
      options: [{ title: "Tamaño", values: [...SPRING_SIZES] }],
      variants: SPRING_SIZES.map((size) => ({
        title: `${p.title} / ${size}`,
        sku: uniqueSku(`${handle}-${size}`),
        options: { Tamaño: size },
        prices: [
          { amount: ARS[size], currency_code: "ars" },
          { amount: USD[size], currency_code: "usd" },
        ],
      })),
    };

    await createProductsWorkflow(container).run({
      input: {
        products: [productData as any],
      },
    });

    logger.info(`[update-spring-sizes] ✅ Recreado: ${p.title} (${handle})`);
  }

  logger.info("[update-spring-sizes] ✅ Listo. Cambios aplicados SOLO a Ramos primaverales.");
}

