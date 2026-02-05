import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { CATEGORIES } from "@/shared/constants";

export default async function verifyComplementosSanValentin({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const target = CATEGORIES.complementosSanValentin;

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "status", "categories.name"],
  });

  const matches = (products || []).filter((p: any) =>
    (p.categories || []).some((c: any) => c?.name === target)
  );

  logger.info(`Categoría objetivo: "${target}"`);
  logger.info(`Productos encontrados: ${matches.length}`);

  for (const p of matches) {
    logger.info(`- ${p.title} (${p.status}) [${p.handle}]`);
  }
}

