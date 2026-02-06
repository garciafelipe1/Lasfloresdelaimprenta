import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { CATEGORIES } from "@/shared/constants";

/**
 * Borra productos de categoría "Box" que no tengan precio ARS en ninguna variante
 * (típicamente duplicados/incompletos).
 *
 * Criterio de borrado (seguro):
 * - product está en categoría "Box"
 * - y para TODAS sus variantes:
 *   - no existe precio con currency_code="ars"
 */
export default async function cleanupBoxNoPrice({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "categories.name",
      "variants.id",
      "variants.title",
      "variants.prices.currency_code",
      "variants.prices.amount",
    ],
  });

  const boxProducts = (products || []).filter((p: any) =>
    (p?.categories || []).some((c: any) => c?.name === CATEGORIES.box),
  );

  const toDelete: Array<{ id: string; title: string; handle: string }> = [];

  for (const p of boxProducts as any[]) {
    const variants = (p.variants || []) as any[];
    const hasArsPrice = variants.some((v) => {
      const prices = (v?.prices || []) as any[];
      return prices.some(
        (pr) =>
          String(pr?.currency_code || "").toLowerCase() === "ars" &&
          typeof pr?.amount === "number",
      );
    });

    if (!hasArsPrice) {
      toDelete.push({
        id: String(p.id),
        title: String(p.title ?? ""),
        handle: String(p.handle ?? ""),
      });
    }
  }

  logger.info(`[cleanup-box-no-price] Box encontrados: ${boxProducts.length}`);
  logger.info(
    `[cleanup-box-no-price] Candidatos a borrar (sin precio ARS): ${toDelete.length}`,
  );

  if (!toDelete.length) {
    logger.info("[cleanup-box-no-price] ✅ Nada para borrar.");
    return;
  }

  for (const p of toDelete) {
    await productModuleService.deleteProducts([p.id]);
    logger.info(
      `[cleanup-box-no-price] 🗑️  Borrado: "${p.title}" (${p.handle}) id=${p.id}`,
    );
  }

  logger.info("[cleanup-box-no-price] ✅ Listo.");
}


