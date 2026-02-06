import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createProductVariantsWorkflow } from "@medusajs/medusa/core-flows";
import { CATEGORIES } from "@/shared/constants";

/**
 * Aplica variaciones SOLO a productos existentes de la categoría "San Valentín"
 * (sin crear ni duplicar productos).
 *
 * Variaciones + precios ARS:
 * X3  50.000
 * X6  84.000
 * X6 + 1 Lilium  94.000
 * X12 154.000
 * X12 + 1 Lilium 164.000
 * X14 175.000
 * X24 297.000
 */
export default async function updateSanValentinVariations({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);
  const pricingModuleService = container.resolve(Modules.PRICING);
  const remoteLink = container.resolve(ContainerRegistrationKeys.LINK);

  const OPTION_TITLE = "Cantidad";
  const VARIATIONS = [
    { label: "X3", ars: 50_000, usd: 50 },
    { label: "X6", ars: 84_000, usd: 84 },
    { label: "X6 + 1 Lilium", ars: 94_000, usd: 94 },
    { label: "X12", ars: 154_000, usd: 154 },
    { label: "X12 + 1 Lilium", ars: 164_000, usd: 164 },
    { label: "X14", ars: 175_000, usd: 175 },
    { label: "X24", ars: 297_000, usd: 297 },
  ] as const;

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
      "variants.options.option_id",
      "variants.options.value",
      "variants.price_set.id",
    ],
  });

  const targets = (products || []).filter((p: any) => {
    const isSv = (p?.categories || []).some(
      (c: any) => c?.name === CATEGORIES.sanValentin,
    );
    const isExclusive = Boolean(p?.metadata?.exclusive);
    return isSv && !isExclusive;
  });

  logger.info(
    `[update-san-valentin-variations] Objetivo: ${targets.length} producto(s) en "${CATEGORIES.sanValentin}" (no exclusivos)`,
  );

  for (const p of targets as any[]) {
    await productModuleService.updateProducts(p.id, {
      options: [{ title: OPTION_TITLE, values: VARIATIONS.map((v) => v.label) }],
    } as any);

    const { data: refreshed } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "options.id",
        "options.title",
        "options.values.id",
        "options.values.value",
        "variants.id",
        "variants.title",
        "variants.options.option_id",
        "variants.options.value",
        "variants.price_set.id",
      ],
      filters: { id: { $eq: p.id } } as any,
    });

    const product = refreshed?.[0];
    if (!product) continue;

    const qtyOption = (product.options || []).find(
      (o: any) => o?.title === OPTION_TITLE,
    );
    if (!qtyOption?.id) {
      throw new Error(
        `[update-san-valentin-variations] No existe opción "${OPTION_TITLE}" en product ${p.id}`,
      );
    }

    const valueIdByLabel = new Map<string, string>();
    for (const v of qtyOption.values || []) {
      valueIdByLabel.set(String(v.value), String(v.id));
    }

    const variants = (product.variants || []) as any[];

    const findVariantByLabel = (label: string) => {
      return variants.find((v) => {
        const opts = (v.options || []) as any[];
        const match = opts.find((ov) => ov?.option_id === qtyOption.id);
        return String(match?.value) === label;
      });
    };

    for (const variation of VARIATIONS) {
      const existingVariant = findVariantByLabel(variation.label);

      if (!existingVariant?.id) {
        await createProductVariantsWorkflow(container).run({
          input: {
            product_variants: [
              {
                product_id: String(product.id),
                title: `${product.title} / ${variation.label}`,
                options: { [OPTION_TITLE]: variation.label },
                prices: [
                  { amount: variation.ars, currency_code: "ars" },
                  { amount: variation.usd, currency_code: "usd" },
                ],
                manage_inventory: true,
              },
            ],
          },
        });
        continue;
      }

      const optionValueId = valueIdByLabel.get(variation.label);
      if (optionValueId) {
        await productModuleService.updateProductVariants(existingVariant.id, {
          title: `${product.title} / ${variation.label}`,
          options: [{ id: optionValueId }],
        } as any);
      }

      const priceSetId = existingVariant.price_set?.id as string | undefined;
      if (!priceSetId) {
        const created = await pricingModuleService.createPriceSets({
          prices: [
            { amount: variation.ars, currency_code: "ars" },
            { amount: variation.usd, currency_code: "usd" },
          ],
        } as any);
        await remoteLink.create([
          {
            [Modules.PRODUCT]: { variant_id: existingVariant.id },
            [Modules.PRICING]: { price_set_id: created.id },
          },
        ]);
      } else {
        await pricingModuleService.updatePriceSets(priceSetId, {
          prices: [
            { amount: variation.ars, currency_code: "ars" },
            { amount: variation.usd, currency_code: "usd" },
          ],
        } as any);
      }
    }

    logger.info(`✅ San Valentín: actualizado "${p.title}"`);
  }

  logger.info("[update-san-valentin-variations] ✅ Listo.");
}

