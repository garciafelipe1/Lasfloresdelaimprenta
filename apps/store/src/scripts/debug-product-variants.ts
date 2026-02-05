import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function debugProductVariants({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const handle = process.env.HANDLE || "architecture-of-love";

  logger.info(`[debug-variants] Buscando producto por handle: ${handle}`);

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "handle",
      "title",
      "status",
      "variants.id",
      "variants.title",
      "variants.sku",
      "variants.inventory_items.id",
      "variants.inventory_items.sku",
    ],
    filters: {
      handle: {
        $eq: handle,
      },
    },
  });

  if (!products?.length) {
    logger.warn(`[debug-variants] No se encontró producto con handle ${handle}`);
    return;
  }

  const p: any = products[0];
  logger.info(
    `[debug-variants] Producto: ${p.title} (${p.handle}) status=${p.status} id=${p.id}`,
  );

  const vars = (p.variants || []) as any[];
  logger.info(`[debug-variants] Variants: ${vars.length}`);
  vars.forEach((v) => {
    const invs = (v.inventory_items || []) as any[];
    logger.info(
      `- variant "${v.title}" sku=${v.sku || "(sin-sku)"} inv_items=${invs.length} ${invs.length ? invs.map((i) => `${i.sku || "(sin-sku)"}:${i.id}`).join(", ") : ""
      }`,
    );
  });
}

