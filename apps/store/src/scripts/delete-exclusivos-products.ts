import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

const CATEGORY_NAME = "Diseños exclusivos";

/**
 * Borra todos los productos de la categoría "Diseños exclusivos"
 * y opcionalmente la categoría si queda vacía.
 *
 * DRY_RUN=true por defecto.
 * - DRY_RUN=true  -> solo lista
 * - DRY_RUN=false -> borra productos (la categoría se puede borrar después desde admin si aplica)
 */
export default async function deleteExclusivosProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);

  const dryRun = String(process.env.DRY_RUN ?? "true").toLowerCase() !== "false";

  logger.info(`Modo: ${dryRun ? "DRY_RUN (no borra)" : "BORRADO REAL"}`);
  logger.info(`Categoría objetivo: "${CATEGORY_NAME}"`);

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "categories.id", "categories.name"],
  });

  const candidates = (products || []).filter((p: any) =>
    (p?.categories || []).some((c: any) => c?.name === CATEGORY_NAME)
  );

  if (!candidates.length) {
    logger.info(`No se encontraron productos en "${CATEGORY_NAME}" para borrar.`);
    return;
  }

  logger.info(`Encontrados ${candidates.length} producto(s):`);
  candidates.forEach((p: any) =>
    logger.info(`- ${p.title} (handle: ${p.handle}, id: ${p.id})`)
  );

  if (dryRun) {
    logger.info("DRY_RUN=true → no se borró nada. Ejecutá con DRY_RUN=false para borrar.");
    return;
  }

  for (const p of candidates) {
    await productModuleService.deleteProducts([p.id]);
    logger.info(`✅ Borrado: ${p.title} (${p.handle})`);
  }

  logger.info("Listo. Si la categoría queda vacía, podés borrarla desde el admin de Medusa.");
}
