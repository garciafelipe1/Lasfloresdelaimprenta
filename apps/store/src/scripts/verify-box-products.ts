import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { CATEGORIES } from "@/shared/constants";

export default async function verifyBoxProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const categoryName = CATEGORIES.box;

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "status",
      "thumbnail",
      "images.url",
      "categories.name",
      "options.title",
      "options.values.value",
      "variants.title",
      "variants.prices.currency_code",
      "variants.prices.amount",
    ],
  });

  const matches = (products || []).filter((p: any) =>
    (p?.categories || []).some((c: any) => c?.name === categoryName),
  );

  logger.info(`Categoría objetivo: "${categoryName}"`);
  logger.info(`Productos encontrados: ${matches.length}`);

  for (const p of matches as any[]) {
    logger.info(`- ${p.title} [${p.handle}] status=${p.status}`);
    logger.info(`  thumbnail: ${p.thumbnail ?? "(vacío)"}`);
    const img0 = (p.images || [])?.[0]?.url;
    logger.info(`  image[0]: ${img0 ?? "(sin imágenes)"}`);
    const optionTitles = (p.options || []).map((o: any) => o?.title).filter(Boolean);
    logger.info(`  options: ${optionTitles.join(", ") || "(sin opciones)"}`);

    const variants = (p.variants || []) as any[];
    for (const v of variants) {
      const ars = (v.prices || []).find((pr: any) => pr?.currency_code === "ars")
        ?.amount;
      logger.info(`  variant: ${v.title} ars=${ars ?? "?"}`);
    }
  }
}

