import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { CATEGORIES } from "@/shared/constants";
import { getExpandedCategories } from "@/shared/category-mapping";

/**
 * Borra productos que aparecen bajo la categoría "San Valentín".
 *
 * Importante: por compatibilidad, "San Valentín" incluye aliases ("Bodas", "Follaje")
 * según `CATEGORY_ALIASES`. Este script borra productos en cualquiera de esas categorías.
 *
 * Por seguridad corre en DRY_RUN por defecto.
 * - DRY_RUN=true  -> solo lista lo que borraría
 * - DRY_RUN=false -> borra efectivamente
 */
export default async function deleteSanValentinProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);

  const dryRun = String(process.env.DRY_RUN ?? "true").toLowerCase() !== "false";

  const expanded = getExpandedCategories(CATEGORIES.sanValentin);
  const targetCategories = new Set(expanded);

  logger.info(
    `Objetivo: borrar productos de categorías: ${expanded.map((c) => `"${c}"`).join(", ")}`
  );
  logger.info(`Modo: ${dryRun ? "DRY_RUN (no borra)" : "BORRADO REAL"}`);

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "categories.name"],
  });

  const candidates = (products || []).filter((p: any) => {
    const names = (p?.categories || [])
      .map((c: any) => c?.name)
      .filter((n: any) => typeof n === "string");
    return names.some((n: string) => targetCategories.has(n));
  });

  if (!candidates.length) {
    logger.info("No se encontraron productos para borrar en esas categorías.");
    return;
  }

  logger.info(`Encontrados ${candidates.length} producto(s):`);
  candidates.forEach((p: any) =>
    logger.info(`- ${p.title} (handle: ${p.handle}, id: ${p.id})`)
  );

  if (dryRun) {
    logger.info("DRY_RUN=true → no se borró nada.");
    return;
  }

  for (const p of candidates) {
    await productModuleService.deleteProducts([p.id]);
    logger.info(`✅ Borrado: ${p.title} (${p.handle})`);
  }
}

