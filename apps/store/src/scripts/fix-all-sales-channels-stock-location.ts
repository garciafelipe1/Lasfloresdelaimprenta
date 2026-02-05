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
 * Fix generalizado para evitar:
 * "Sales channel sc_xxx is not associated with any stock location"
 *
 * - Asegura que exista al menos 1 stock location (crea uno si no hay)
 * - Vincula TODOS los sales channels al stock location principal
 * - Asegura niveles de inventario (stocked_quantity) para todos los inventory_items en ese location
 *
 * Nota: esto es ideal para DEV/local. En prod quizás quieras limitar qué channels
 * se vinculan a qué locations.
 */
export default async function fixAllSalesChannelsStockLocation({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);

  logger.info("[fix-stock-all] Buscando Stock Location...");

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
      `[fix-stock-all] No pude listar stock locations (continuo creando uno). Error: ${e?.message || e}`,
    );
  }

  if (!stockLocation) {
    logger.info("[fix-stock-all] No hay stock location. Creando uno nuevo...");
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

  logger.info("[fix-stock-all] Listando Sales Channels...");
  const salesChannels = await salesChannelModuleService.listSalesChannels();

  if (!salesChannels.length) {
    throw new Error("[fix-stock-all] No se encontró ningún sales channel.");
  }

  logger.info("[fix-stock-all] Vinculando channels al stock location...", {
    stock_location_id: stockLocation.id,
    sales_channels: salesChannels.map((sc: any) => sc.id),
  });

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: salesChannels.map((sc: any) => sc.id),
    },
  });

  logger.info("[fix-stock-all] Asegurando niveles de inventario...");

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
      `[fix-stock-all] No pude listar inventory levels (voy a intentar crear igualmente). Error: ${e?.message || e}`,
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
      `[fix-stock-all] ✅ Levels creados: ${inventory_levels.length}`,
    );
  } else {
    logger.info("[fix-stock-all] ✅ Inventory levels ya estaban OK.");
  }

  logger.info("[fix-stock-all] ✅ Listo. Todos los sales channels tienen stock location asociado.");
}

