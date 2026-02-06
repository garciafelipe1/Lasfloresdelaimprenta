import { ExecArgs, CreateInventoryLevelInput } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows";
import { ProductStatus } from "@medusajs/framework/utils";

/**
 * Crea un producto de prueba publicado que vale $1 ARS con la foto de un ramo.
 * - Si ya existe por handle, lo borra y lo recrea.
 * - Asegura inventario en el stock location principal para que se pueda agregar al carrito.
 */
export default async function seedRamo1Peso({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);

  const title = "Ramo Test $1";
  const handle = "ramo-test-1-peso";
  const imageUrl =
    "/assets/img/productos/san-valentin/ramo-san-valentin-1-1.png";

  // Shipping profile (requerido)
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });
  const shippingProfile = shippingProfiles[0];
  if (!shippingProfile) {
    throw new Error('No se encontró "Default Shipping Profile".');
  }

  // Sales channel default (requerido)
  const defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });
  if (!defaultSalesChannel.length) {
    throw new Error('No se encontró "Default Sales Channel".');
  }

  // Categoría: usar San Valentín si existe, sino crearla
  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
  });
  const categoryName = "San Valentín";
  let category = (categories || []).find((c: any) => c?.name === categoryName);

  if (!category) {
    logger.info(
      `[seed-ramo-1-peso] Categoría "${categoryName}" no existe. Creándola...`,
    );
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: [
          {
            name: categoryName,
            is_active: true,
          },
        ],
      },
    });
    category = (result as any[])?.[0];
  }

  if (!category?.id) {
    throw new Error("[seed-ramo-1-peso] No se pudo resolver category_id.");
  }

  // Si ya existe, borrar y recrear (para asegurar precio e imagen)
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
    logger.info(
      `[seed-ramo-1-peso] Ya existe ${handle}. Borrando para recrear...`,
    );
    await productModuleService.deleteProducts([existing[0].id]);
  }

  // Evitar colisiones de SKUs a nivel inventory_item
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

  const sku = uniqueSku(`${handle}-default`);

  logger.info(
    `[seed-ramo-1-peso] Creando producto "${title}" con precio $1 ARS...`,
  );

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title,
          description:
            "<p>Producto de prueba para validar carrito/checkout (precio $1).</p>",
          category_ids: [category.id],
          handle,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          thumbnail: imageUrl,
          images: [{ url: imageUrl }],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
          options: [{ title: "Presentación", values: ["Default"] }],
          variants: [
            {
              title: "Default",
              sku,
              options: { Presentación: "Default" },
              prices: [
                {
                  // En este proyecto se manejan montos como pesos “display” (no centavos)
                  amount: 1,
                  currency_code: "ars",
                },
              ],
            },
          ],
        } as any,
      ],
    },
  });

  // Resolver stock location (preferimos el nombre del seed)
  const { data: locations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  });
  const stockLocation =
    (locations || []).find((l: any) => l?.name === "La Floreria De La Imprenta") ||
    (locations || [])[0];

  if (!stockLocation?.id) {
    throw new Error(
      "[seed-ramo-1-peso] No se encontró stock location. Corré fix:stock primero.",
    );
  }

  // Asegurar inventario: crear levels faltantes para TODOS los inventory_items.
  // (Es la forma más robusta porque la relación variant->inventory_item puede exponer ids "pvitem_*"
  // que no son inventory_item reales.)
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });

  const { data: existingLevels } = await query.graph({
    entity: "inventory_level",
    fields: ["inventory_item_id", "location_id"],
    filters: { location_id: stockLocation.id } as any,
  });

  const existingSet = new Set<string>();
  (existingLevels || []).forEach((l: any) => {
    if (l?.inventory_item_id && l?.location_id) {
      existingSet.add(`${l.location_id}:${l.inventory_item_id}`);
    }
  });

  const inventory_levels: CreateInventoryLevelInput[] = (inventoryItems || [])
    .map((i: any) => String(i.id))
    .filter((id) => !existingSet.has(`${stockLocation.id}:${id}`))
    .map((id) => ({
      location_id: stockLocation.id,
      inventory_item_id: id,
      stocked_quantity: 100,
    }));

  if (inventory_levels.length) {
    await createInventoryLevelsWorkflow(container).run({
      input: { inventory_levels },
    });
  }

  logger.info(
    `[seed-ramo-1-peso] ✅ Listo. Producto creado: handle=${handle} sku=${sku} stockLocation=${stockLocation.id}`,
  );
}

