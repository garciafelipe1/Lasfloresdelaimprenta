import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { CATEGORIES } from "@/shared/constants";

/**
 * Borra TODOS los productos de la categoría "Ramos primaverales".
 *
 * DRY_RUN=true por defecto.
 * - DRY_RUN=true  -> lista
 * - DRY_RUN=false -> borra
 */
export default async function deleteRamosPrimaveralesProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);

  const dryRun = String(process.env.DRY_RUN ?? "true").toLowerCase() !== "false";
  const categoryName = CATEGORIES.ramosPrimaverales;

  logger.info(`Modo: ${dryRun ? "DRY_RUN (no borra)" : "BORRADO REAL"}`);
  logger.info(`Categoría objetivo: "${categoryName}"`);

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "categories.name"],
  });

  const candidates = (products || []).filter((p: any) =>
    (p?.categories || []).some((c: any) => c?.name === categoryName)
  );

  if (!candidates.length) {
    logger.info("No se encontraron productos de Ramos primaverales para borrar.");
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

