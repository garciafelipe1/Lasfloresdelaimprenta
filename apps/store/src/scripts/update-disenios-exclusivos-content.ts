/**
 * Actualiza contenido de productos de la categoría "Diseños Exclusivos":
 * title, description, images, thumbnail, metadata y precios de variantes.
 *
 * Incluye productos que aún estén en "Día de la Mujer" (pre-migración) o ya en "Diseños Exclusivos".
 * Ejecutar: pnpm run update:disenios-exclusivos-content
 */
import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import slugify from "slugify";
import { CATEGORIES, LEGACY_CATEGORIES } from "@/shared/constants";
import { diseniosExclusivos } from "./seed/products/disenios-exclusivos.seed";

const toHandle = (value: string) =>
  slugify(value, { lower: true, trim: true, strict: true });

const PRODUCT_MAPPING: Record<string, (typeof diseniosExclusivos)[number]> = {};
for (const p of diseniosExclusivos) {
  PRODUCT_MAPPING[toHandle(p.title)] = p;
}
// Handles legacy (antes de slugificar)
PRODUCT_MAPPING["dulce-complicidad"] = diseniosExclusivos.find((p) => p.title === "Admiración Sutil")!;
PRODUCT_MAPPING["amor-en-equilibrio"] = diseniosExclusivos.find((p) => p.title === "Fuerza y Equilibrio")!;
PRODUCT_MAPPING["chispa-vital"] = diseniosExclusivos.find((p) => p.title === "Energía Creadora")!;
PRODUCT_MAPPING["el-clasico-enamorado"] = diseniosExclusivos.find((p) => p.title === "Reconocimiento Absoluto")!;
PRODUCT_MAPPING["declaracion-absoluta"] = diseniosExclusivos.find((p) => p.title === "Mujer Líder")!;
PRODUCT_MAPPING["pasion-sin-filtros"] = diseniosExclusivos.find((p) => p.title === "Determinación Pura")!;
PRODUCT_MAPPING["ternura-infinita"] = diseniosExclusivos.find((p) => p.title === "Elegancia y Gracia")!;
PRODUCT_MAPPING["box-love-story"] = diseniosExclusivos.find((p) => p.title === "Box Vanguardia Femenina")!;
PRODUCT_MAPPING["romance-perfumado"] = diseniosExclusivos.find((p) => p.title === "Esencia Inolvidable")!;
PRODUCT_MAPPING["valentines-gold-edition"] = diseniosExclusivos.find((p) => p.title === "Edición Oro 8M")!;

const X_VARIATIONS = [
  { label: "X3", ars: 50_000, usd: 50 },
  { label: "X6", ars: 84_000, usd: 84 },
  { label: "X6 + 1 Lilium", ars: 94_000, usd: 94 },
  { label: "X12", ars: 154_000, usd: 154 },
  { label: "X12 + 1 Lilium", ars: 164_000, usd: 164 },
  { label: "X14", ars: 175_000, usd: 175 },
  { label: "X24", ars: 297_000, usd: 297 },
] as const;

export default async function updateDiseniosExclusivosContent({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);
  const pricingModuleService = container.resolve(Modules.PRICING);
  const remoteLink = container.resolve(ContainerRegistrationKeys.LINK);

  const categoryName = CATEGORIES.sanValentin;
  const legacyCategoryName = LEGACY_CATEGORIES.diaDeLaMujer;

  logger.info("[update-disenios-exclusivos-content] Iniciando...");

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "categories.name",
      "variants.id",
      "variants.title",
      "variants.options.value",
      "variants.price_set.id",
    ],
  });

  const targetProducts = (products || []).filter((p: any) =>
    (p?.categories || []).some(
      (c: any) => c?.name === categoryName || c?.name === legacyCategoryName
    )
  );

  logger.info(
    `[update-disenios-exclusivos-content] Productos a procesar: ${targetProducts.length} (categoría "${categoryName}" o "${legacyCategoryName}")`
  );

  let updated = 0;
  let skipped = 0;

  for (const product of targetProducts as any[]) {
    const oldHandle = product.handle;
    const newData = PRODUCT_MAPPING[oldHandle];

    if (!newData) {
      logger.info(
        `[update-disenios-exclusivos-content] ⏭️ Saltando: ${product.title} (handle: ${oldHandle}) - sin mapeo`
      );
      skipped++;
      continue;
    }

    const newHandle = toHandle(newData.title);

    const updateData: any = {
      title: newData.title,
      description: newData.description,
      images: newData.images.map((img: string) => ({ url: img })),
      thumbnail: newData.images[0] || null,
    };

    if (newData.metadata) {
      updateData.metadata = {
        ...(product.metadata || {}),
        ...newData.metadata,
      };
    }

    if (oldHandle !== newHandle) {
      const existingWithNewHandle = targetProducts.find(
        (p: any) => p.handle === newHandle && p.id !== product.id
      );
      if (!existingWithNewHandle) {
        updateData.handle = newHandle;
        logger.info(
          `[update-disenios-exclusivos-content] 🔄 Handle: ${oldHandle} → ${newHandle}`
        );
      }
    }

    try {
      await productModuleService.updateProducts(String(product.id), updateData);

      const variants = (product.variants || []) as any[];
      for (const variant of variants) {
        const variantOptionValue = (variant.options || [])?.[0]?.value;
        if (!variantOptionValue) continue;

        const variation = X_VARIATIONS.find((v) => v.label === variantOptionValue);
        if (!variation) continue;

        const priceSetId = variant.price_set?.id as string | undefined;
        if (!priceSetId) {
          const created = await pricingModuleService.createPriceSets({
            prices: [
              { amount: variation.ars, currency_code: "ars" },
              { amount: variation.usd, currency_code: "usd" },
            ],
          } as any);
          await remoteLink.create([
            {
              [Modules.PRODUCT]: { variant_id: variant.id },
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

      logger.info(
        `[update-disenios-exclusivos-content] ✅ ${product.title} → ${newData.title}`
      );
      updated++;
    } catch (error: any) {
      logger.error(
        `[update-disenios-exclusivos-content] ❌ ${product.title}: ${error.message}`
      );
    }
  }

  logger.info(
    `[update-disenios-exclusivos-content] Completado. Actualizados: ${updated}, Saltados: ${skipped}`
  );
}
