import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

const HANDLE = "fresh-vibrant";

/**
 * Elimina el producto Box "FRESH VIBRANT" (handle fresh-vibrant) de Medusa.
 *
 * DRY_RUN=true por defecto.
 * - DRY_RUN=true  -> solo lista si existe
 * - DRY_RUN=false -> borra el producto
 */
export default async function deleteFreshVibrantProduct({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);

  const dryRun = String(process.env.DRY_RUN ?? "true").toLowerCase() !== "false";

  logger.info(`Modo: ${dryRun ? "DRY_RUN (no borra)" : "BORRADO REAL"}`);
  logger.info(`Handle objetivo: "${HANDLE}"`);

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle"],
  });

  const product = (products ?? []).find(
    (p: { handle?: string }) => p.handle === HANDLE,
  ) as { id?: string; title?: string; handle?: string } | undefined;

  if (!product?.id) {
    logger.info(`No se encontró producto con handle "${HANDLE}" (ya estaba borrado o nunca existió).`);
    return;
  }

  logger.info(`Encontrado: "${product.title}" (${product.handle}) id=${product.id}`);

  if (dryRun) {
    logger.info("DRY_RUN=true → no se borró nada. Ejecutá con DRY_RUN=false para borrar.");
    return;
  }

  await productModuleService.deleteProducts([product.id]);
  logger.info(`✅ Borrado: ${product.title} (${product.handle})`);
}
