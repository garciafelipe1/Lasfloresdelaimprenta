import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { CATEGORIES } from "@/shared/constants";

export default async function verifyRamosPrimaveralesProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const categoryName = CATEGORIES.ramosPrimaverales;

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "thumbnail",
      "images.url",
      "categories.name",
      "variants.title",
      "variants.sku",
      "variants.prices.amount",
      "variants.prices.currency_code",
    ],
  });

  const matches = (products || []).filter((p: any) =>
    (p.categories || []).some((c: any) => c?.name === categoryName)
  );

  logger.info(`Categoría objetivo: "${categoryName}"`);
  logger.info(`Productos encontrados: ${matches.length}`);

  for (const p of matches) {
    const urls = (p.images || []).map((i: any) => i?.url).filter(Boolean);
    logger.info(`- ${p.title} [${p.handle}]`);
    logger.info(`  thumbnail: ${p.thumbnail ?? "null"}`);
    logger.info(`  images: ${urls.join(", ")}`);
    const variants = (p.variants || []) as any[];
    for (const v of variants) {
      const prices = (v?.prices || [])
        .map((pr: any) => `${pr.currency_code}:${pr.amount}`)
        .join(", ");
      logger.info(`  variant: ${v?.title ?? "?"} sku=${v?.sku ?? "?"} prices=[${prices}]`);
    }
  }
}

