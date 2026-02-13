import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { CATEGORIES } from "@/shared/constants";
import { getExpandedCategories } from "@/shared/category-mapping";

/**
 * Restaura los precios por variante (X3, X6, etc.) en productos San Valentín.
 * Solo actualiza price_sets, no toca opciones ni títulos.
 *
 * X3  50.000  |  X6  84.000  |  X6+1 Lilium  94.000  |  X12  154.000
 * X12+1 Lilium  164.000  |  X14  175.000  |  X24  297.000
 */
const VARIATIONS = [
  { label: "X3", ars: 50_000, usd: 50 },
  { label: "X6", ars: 84_000, usd: 84 },
  { label: "X6 + 1 Lilium", ars: 94_000, usd: 94 },
  { label: "X12", ars: 154_000, usd: 154 },
  { label: "X12 + 1 Lilium", ars: 164_000, usd: 164 },
  { label: "X14", ars: 175_000, usd: 175 },
  { label: "X24", ars: 297_000, usd: 297 },
] as const;

export default async function restoreSanValentinVariationPrices({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const pricingModuleService = container.resolve(Modules.PRICING);

  const expanded = getExpandedCategories(CATEGORIES.sanValentin);
  const targets = new Set(expanded);

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "metadata", "categories.name", "variants.id", "variants.title", "variants.price_set.id"],
  });

  const sanValentinProducts = (products || []).filter((p: any) =>
    (p?.categories || []).some((c: any) => targets.has(c?.name))
  );

  for (const p of sanValentinProducts as any[]) {
    const variants = (p.variants || []) as any[];
    for (const variant of variants) {
      const title = String(variant?.title ?? "");
      const variation = VARIATIONS.find((v) => title.includes(v.label));
      if (!variation) continue;
      const priceSetId = variant?.price_set?.id;
      if (!priceSetId) continue;
      await pricingModuleService.updatePriceSets(priceSetId, {
        prices: [
          { amount: variation.ars, currency_code: "ars" },
          { amount: variation.usd, currency_code: "usd" },
        ],
      } as any);
    }
    logger.info(`✅ ${p.title} → precios por variante restaurados`);
  }

  logger.info("[restore-san-valentin-variation-prices] ✅ Listo.");
}

