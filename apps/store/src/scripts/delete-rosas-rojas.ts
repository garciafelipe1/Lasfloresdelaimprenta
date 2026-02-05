import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import slugify from "slugify";

export default async function deleteRosasRojas({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);

  const title = "Rosas Rojas";
  const handle = slugify(title, { lower: true, trim: true });
  const skuPrefix = `${handle}-`;

  // Traer productos con variantes para detectar también por SKU
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

  logger.info(`Encontrados ${candidates.length} producto(s) para borrar:`);
  candidates.forEach((p: any) =>
    logger.info(`- ${p.title} (handle: ${p.handle}, id: ${p.id})`)
  );

  for (const p of candidates) {
    await productModuleService.deleteProducts([p.id]);
    logger.info(`✅ Borrado: ${p.title} (${p.handle})`);
  }
}

