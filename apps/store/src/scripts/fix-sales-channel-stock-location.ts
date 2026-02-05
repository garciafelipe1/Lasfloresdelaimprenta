import { CreateInventoryLevelInput, ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";
import {
  createInventoryLevelsWorkflow,
  createStockLocationsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows";

/**
 * Fix para error al agregar al carrito:
 * "Sales channel sc_xxx is not associated with any stock location"
 *
 * - Asegura que exista un stock location
 * - Vincula el sales channel por defecto al stock location
 * - Crea niveles de inventario (stocked_quantity) para inventory_items sin nivel
 */
export default async function fixSalesChannelStockLocation({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);

  logger.info("[fix-stock] Buscando Sales Channel por defecto...");

  let salesChannels = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  if (!salesChannels.length) {
    salesChannels = await salesChannelModuleService.listSalesChannels();
  }

  if (!salesChannels.length) {
    throw new Error(
      "[fix-stock] No se encontró ningún sales channel. Crealo desde Admin o corré seed.ts",
    );
  }

  const defaultSalesChannel = salesChannels[0];

  logger.info("[fix-stock] Buscando Stock Location...");

  let stockLocation: { id: string; name?: string } | undefined;
  try {
    const { data: locations } = await query.graph({
      entity: "stock_location",
      fields: ["id", "name"],
    });
    stockLocation =
      (locations || []).find((l: any) => l?.name === "La Floreria De La Imprenta") ||
      (locations || [])[0];
  } catch (e: any) {
    logger.warn(
      `[fix-stock] No pude listar stock locations vía query.graph (continuo creando uno). Error: ${e?.message || e}`,
    );
  }

  if (!stockLocation) {
    logger.info("[fix-stock] No hay stock location. Creando uno nuevo...");
    const { result } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [
          {
            name: "La Floreria De La Imprenta",
            address: {
              city: "Bahía Blanca",
              country_code: "ar",
              address_1: "Calle Falsa 123",
              province: "Buenos Aires",
              postal_code: "xxxx",
            },
          },
        ],
      },
    });
    stockLocation = result[0];
  }

  logger.info("[fix-stock] Vinculando Sales Channel a Stock Location...", {
    sales_channel_id: defaultSalesChannel.id,
    stock_location_id: stockLocation.id,
  });

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel.id],
    },
  });

  logger.info("[fix-stock] Asegurando niveles de inventario...");

  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });

  const existingLevels = new Set<string>();
  try {
    const { data: inventoryLevels } = await query.graph({
      entity: "inventory_level",
      fields: ["inventory_item_id", "location_id"],
      filters: { location_id: stockLocation.id } as any,
    });
    (inventoryLevels || []).forEach((l: any) => {
      if (l?.location_id && l?.inventory_item_id) {
        existingLevels.add(`${l.location_id}:${l.inventory_item_id}`);
      }
    });
  } catch (e: any) {
    logger.warn(
      `[fix-stock] No pude listar inventory levels (voy a intentar crear igualmente). Error: ${e?.message || e}`,
    );
  }

  const inventory_levels: CreateInventoryLevelInput[] = [];

  for (const item of inventoryItems || []) {
    const key = `${stockLocation.id}:${(item as any).id}`;
    if (existingLevels.has(key)) continue;

    inventory_levels.push({
      location_id: stockLocation.id,
      inventory_item_id: (item as any).id,
      stocked_quantity: 100,
    });
  }

  if (inventory_levels.length) {
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels,
      },
    });
    logger.info(
      `[fix-stock] ✅ Inventario listo. Levels creados: ${inventory_levels.length}`,
    );
  } else {
    logger.info("[fix-stock] ✅ Inventario ya estaba configurado (sin cambios).");
  }

  logger.info(
    "[fix-stock] ✅ Listo. Ahora deberías poder agregar productos al carrito.",
  );
}

