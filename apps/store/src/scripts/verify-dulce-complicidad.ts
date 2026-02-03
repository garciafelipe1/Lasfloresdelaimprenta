import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function verifyDulceComplicidad({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const handle = "dulce-complicidad";

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "status",
      "categories.name",
      "variants.sku",
    ],
    filters: {
      handle: {
        $eq: handle,
      },
    },
  });

  if (!products?.length) {
    logger.info(`❌ No existe producto con handle "${handle}".`);
    return;
  }

  const p: any = products[0];
  logger.info(`✅ Encontrado: ${p.title} (id: ${p.id}, status: ${p.status})`);
  const categories = (p.categories || []).map((c: any) => c?.name).filter(Boolean);
  logger.info(`Categorías: ${categories.join(", ") || "(sin categorías)"}`);
  const skus = (p.variants || []).map((v: any) => v?.sku).filter(Boolean);
  logger.info(`SKUs: ${skus.join(", ") || "(sin SKUs)"}`);
}

