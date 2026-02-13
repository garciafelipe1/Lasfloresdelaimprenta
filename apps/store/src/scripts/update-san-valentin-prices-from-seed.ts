import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { CATEGORIES } from "@/shared/constants";
import { getExpandedCategories } from "@/shared/category-mapping";
import { sanValentin } from "./seed/products/san-valentin.seed";

function normalizeTitle(input: string) {
  return input
    .normalize("NFD")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

/**
 * Actualiza los precios de los productos San Valentín en la DB para que coincidan
 * con el seed. Así el catálogo muestra los precios correctos (ej. 90.000, 164.000).
 *
 * Actualiza TODAS las variantes de cada producto al mismo precio del seed
 * (el que debe verse en el catálogo).
 *
 * Ejecutar: pnpm update:san-valentin-prices-from-seed
 */
export default async function updateSanValentinPricesFromSeed({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const pricingModuleService = container.resolve(Modules.PRICING);

  const expanded = getExpandedCategories(CATEGORIES.sanValentin);
  const targets = new Set(expanded);

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "categories.name",
      "variants.id",
      "variants.price_set.id",
    ],
  });

  const sanValentinProducts = (products || []).filter((p: any) =>
    (p?.categories || []).some((c: any) => targets.has(c?.name))
  );

  const seedByTitle = new Map<string, { ars: number; usd: number }>();
  for (const item of sanValentin as any[]) {
    const key = normalizeTitle(item.title);
    const ars = item.price?.ars?.base;
    const usd = item.price?.usd?.base;
    if (typeof ars === "number" && typeof usd === "number") {
      seedByTitle.set(key, { ars, usd });
    }
  }

  let updated = 0;
  for (const p of sanValentinProducts as any[]) {
    const key = normalizeTitle(p.title);
    const prices = seedByTitle.get(key);
    if (!prices) {
      logger.warn(`[update-san-valentin-prices-from-seed] Sin precio en seed: "${p.title}"`);
      continue;
    }

    const variants = p.variants || [];
    for (const variant of variants) {
      const priceSetId = variant?.price_set?.id;
      if (!priceSetId) continue;
      await pricingModuleService.updatePriceSets(priceSetId, {
        prices: [
          { amount: prices.ars, currency_code: "ars" },
          { amount: prices.usd, currency_code: "usd" },
        ],
      } as any);
    }
    updated += 1;
    logger.info(`✅ ${p.title} → ARS ${prices.ars}, USD ${prices.usd}`);
  }

  logger.info(`[update-san-valentin-prices-from-seed] Listo. Actualizados ${updated} productos.`);
}

