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

// Mapeamos handles actuales (y legacy) → contenido nuevo; también actualizamos handle al slug del nuevo título
// (igual que el seed), salvo colisión con otro producto.
const BY_NEW_TITLE: Record<string, (typeof diseniosExclusivos)[number]> = {};
for (const p of diseniosExclusivos) {
  BY_NEW_TITLE[p.title] = p;
}

const PRODUCT_MAPPING: Record<string, (typeof diseniosExclusivos)[number]> = {
  // Nombres anteriores (handles actuales en DB) → nuevos nombres / descripciones
  "reconocimiento-absoluto": BY_NEW_TITLE["THE MASTERPIECE RED."]!,
  "esencia-inolvidable": BY_NEW_TITLE["THE LILY & ROSE EDIT."]!,
  "mujer-lider": BY_NEW_TITLE["THE CORPORATE RED."]!,
  "determinacion-pura": BY_NEW_TITLE["CRIMSON MONOCHROME."]!,
  "fuerza-y-equilibrio": BY_NEW_TITLE["THE SCARLET STRUCTURE."]!,
  "elegancia-y-gracia": BY_NEW_TITLE["THE BLUSH MINIMAL."]!,
  "box-vanguardia-femenina": BY_NEW_TITLE["THE SIGNATURE HATBOX."]!,
  "admiracion-sutil": BY_NEW_TITLE["THE NEUTRAL PALETTE."]!,
  "energia-creadora": BY_NEW_TITLE["VIBRANT CORAL EDIT."]!,
  "edicion-oro-8m": BY_NEW_TITLE["THE PREMIUM ROUGE."]!,
  "box-esencia-y-admiración": BY_NEW_TITLE["THE CURATED EXPERIENCE BOX."]!,
  "box-esencia-y-admiracion": BY_NEW_TITLE["THE CURATED EXPERIENCE BOX."]!,
  "flower-bag": BY_NEW_TITLE["THE PETITE GESTURE."]!,
  "bouquet-spring-en-florero": BY_NEW_TITLE["THE DYNAMIC CENTERPIECE."]!,

  // Handles legacy del catálogo anterior (si todavía existieran)
  "dulce-complicidad": BY_NEW_TITLE["THE NEUTRAL PALETTE."]!,
  "amor-en-equilibrio": BY_NEW_TITLE["THE SCARLET STRUCTURE."]!,
  "chispa-vital": BY_NEW_TITLE["VIBRANT CORAL EDIT."]!,
  "el-clasico-enamorado": BY_NEW_TITLE["THE MASTERPIECE RED."]!,
  "declaracion-absoluta": BY_NEW_TITLE["THE CORPORATE RED."]!,
  "pasion-sin-filtros": BY_NEW_TITLE["CRIMSON MONOCHROME."]!,
  "ternura-infinita": BY_NEW_TITLE["THE BLUSH MINIMAL."]!,
  "box-love-story": BY_NEW_TITLE["THE SIGNATURE HATBOX."]!,
  "romance-perfumado": BY_NEW_TITLE["THE LILY & ROSE EDIT."]!,
  "valentines-gold-edition": BY_NEW_TITLE["THE PREMIUM ROUGE."]!,
};

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

  const productGraphFields = [
    "id",
    "title",
    "handle",
    "categories.name",
    "variants.id",
    "variants.title",
    "variants.options.value",
    "variants.price_set.id",
  ] as const;

  const inExclusive = (p: any) =>
    (p?.categories || []).some(
      (c: any) => c?.name === categoryName || c?.name === legacyCategoryName
    );

  let { data: products } = await query.graph({
    entity: "product",
    fields: [...productGraphFields],
  });

  // Si corrió seed:products tras cambiar títulos, puede haber duplicados: mismo diseño con handle viejo y con slug nuevo.
  // Eliminamos el producto cuyo handle ya es el definitivo (twin) y conservamos el que está en PRODUCT_MAPPING con handle legacy.
  const byHandle = new Map<string, any>();
  for (const p of products || []) {
    if (p?.handle) byHandle.set(p.handle, p);
  }
  const deletedTwinIds = new Set<string>();
  for (const p of products || []) {
    if (!inExclusive(p)) continue;
    const newData = PRODUCT_MAPPING[p.handle];
    if (!newData) continue;
    const desiredHandle = toHandle(newData.title);
    if (p.handle === desiredHandle) continue;
    const twin = byHandle.get(desiredHandle);
    if (!twin || twin.id === p.id || deletedTwinIds.has(twin.id)) continue;
    if (!inExclusive(twin)) continue;
    await productModuleService.deleteProducts([twin.id]);
    deletedTwinIds.add(twin.id);
    byHandle.delete(desiredHandle);
    logger.info(
      `[update-disenios-exclusivos-content] 🗑️ Duplicado (seed) eliminado: "${desiredHandle}" (id ${twin.id}); se conserva "${p.handle}"`
    );
  }

  if (deletedTwinIds.size > 0) {
    const again = await query.graph({
      entity: "product",
      fields: [...productGraphFields],
    });
    products = again.data;
  }

  const targetProducts = (products || []).filter((p: any) => inExclusive(p));

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

    const newHandle = toHandle(newData.title);
    if (oldHandle !== newHandle) {
      const taken = (products || []).some(
        (p: any) => p?.handle === newHandle && p?.id !== product.id
      );
      if (taken) {
        logger.warn(
          `[update-disenios-exclusivos-content] ⚠️ Handle objetivo "${newHandle}" ya existe; se mantiene "${oldHandle}"`
        );
      } else {
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
