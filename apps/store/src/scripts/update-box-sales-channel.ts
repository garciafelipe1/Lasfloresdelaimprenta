import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { CATEGORIES } from "@/shared/constants";

/**
 * Asegura que TODOS los productos de la categoría "Box" estén publicados
 * en el "Default Sales Channel".
 *
 * - No crea ni duplica productos.
 * - No remueve otros sales channels si ya existían.
 */
export default async function updateBoxSalesChannel({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);

  const defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });
  if (!defaultSalesChannel.length) {
    throw new Error('No se encontró "Default Sales Channel".');
  }
  const defaultId = String(defaultSalesChannel[0].id);

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "categories.name",
      "sales_channels.id",
    ],
  });

  const targets = (products || []).filter((p: any) =>
    (p?.categories || []).some((c: any) => c?.name === CATEGORIES.box),
  );

  logger.info(`[update-box-sales-channel] Productos Box: ${targets.length}`);

  for (const p of targets as any[]) {
    const existingIds = new Set<string>(
      (p.sales_channels || [])
        .map((sc: any) => String(sc?.id))
        .filter((id: string) => Boolean(id)),
    );

    if (existingIds.has(defaultId)) {
      logger.info(`- OK: ${p.title} ya está en Default Sales Channel`);
      continue;
    }

    const nextIds = [...existingIds, defaultId];

    await productModuleService.updateProducts(String(p.id), {
      sales_channels: nextIds.map((id) => ({ id })),
    } as any);

    logger.info(`- ✅ Agregado a Default: ${p.title} (${p.handle})`);
  }

  logger.info("[update-box-sales-channel] ✅ Listo.");
}

