import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function debugPureEssence({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const handle = "pure-essence-esencia-pura";

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "metadata",
      "categories.name",
      "options.id",
      "options.title",
      "options.values.id",
      "options.values.value",
      "variants.id",
      "variants.title",
      "variants.options.id",
      "variants.options.option_id",
      "variants.options.value",
      "variants.price_set.id",
      "variants.price_set.prices.currency_code",
      "variants.price_set.prices.amount",
    ],
    filters: {
      handle: { $eq: handle },
    } as any,
  });

  const p = products?.[0];
  if (!p) {
    logger.warn(`No encontrado product handle="${handle}"`);
    return;
  }

  logger.info(`Producto: ${p.title} [${p.handle}] id=${p.id}`);
  logger.info(`exclusive=${Boolean(p?.metadata?.exclusive)}`);
  logger.info(
    `categorías: ${(p.categories || []).map((c: any) => c?.name).join(", ")}`,
  );

  for (const opt of p.options || []) {
    logger.info(`option: ${opt.title} (id=${opt.id})`);
    logger.info(
      `  values: ${(opt.values || [])
        .map((v: any) => `${v.value} (id=${v.id})`)
        .join(", ")}`,
    );
  }

  for (const v of p.variants || []) {
    const opts = (v.options || [])
      .map((ov: any) => `${ov.option_id}:${ov.value} (ov_id=${ov.id})`)
      .join(", ");
    const prices = (v.price_set?.prices || [])
      .map((pr: any) => `${pr.currency_code}:${pr.amount}`)
      .join(", ");
    logger.info(`variant: ${v.title} id=${v.id}`);
    logger.info(`  options: ${opts || "(sin options)"}`);
    logger.info(`  priceset: ${v.price_set?.id ?? "null"} prices=[${prices}]`);
  }
}

