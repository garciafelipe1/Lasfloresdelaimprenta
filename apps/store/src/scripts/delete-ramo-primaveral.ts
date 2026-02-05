import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import slugify from "slugify";

/**
 * Borra el producto legacy "Ramo primaveral".
 *
 * DRY_RUN=true por defecto.
 * - DRY_RUN=true  -> lista
 * - DRY_RUN=false -> borra
 */
export default async function deleteRamoPrimaveral({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);

  const dryRun = String(process.env.DRY_RUN ?? "true").toLowerCase() !== "false";

  const title = "Ramo primaveral";
  const handle = slugify(title, { lower: true, trim: true, strict: true });
  const skuPrefix = `${handle}-`;

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "variants.sku"],
  });

  const candidates = (products || []).filter((p: any) => {
    if (p?.handle === handle) return true;
    if (p?.title === title) return true;
    const skus = (p?.variants || [])
      .map((v: any) => v?.sku)
      .filter((s: any) => typeof s === "string");
    return skus.some((sku: string) => sku === handle || sku.startsWith(skuPrefix));
  });

  if (!candidates.length) {
    logger.info(
      `No se encontró producto para borrar (title="${title}", handle="${handle}", skuPrefix="${skuPrefix}").`
    );
    return;
  }

  logger.info(`Modo: ${dryRun ? "DRY_RUN (no borra)" : "BORRADO REAL"}`);
  logger.info(`Encontrados ${candidates.length} producto(s) para borrar:`);
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

