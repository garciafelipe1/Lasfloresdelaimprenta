import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { CATEGORIES } from "@/shared/constants";

export default async function verifyComplementosImages({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const categoryName = CATEGORIES.complementos;

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "thumbnail", "images.url", "categories.name"],
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
  }
}

