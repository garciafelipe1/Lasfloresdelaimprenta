import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { CATEGORIES } from "@/shared/constants";
import { complementosSanValentin } from "./seed/products/complementos-san-valentin.seed";
import slugify from "slugify";

function normalizeTitle(input: string) {
  return input
    .normalize("NFD")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

const toHandle = (value: string) =>
  slugify(value, { lower: true, trim: true, strict: true });

/**
 * Actualiza contenido de la categoría "Complementos de San Valentín" en la DB:
 * - images + thumbnail
 * - description
 * - metadata (merge)
 * - precios ARS/USD (desde complementos-san-valentin.seed)
 *
 * NO borra nada.
 */
export default async function updateComplementosSanValentinContent({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);
  const pricingModuleService = container.resolve(Modules.PRICING);

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "categories.name",
      "metadata",
      "variants.id",
      "variants.price_set.id",
    ],
  });

  const targetProducts = (products || []).filter((p: any) =>
    (p?.categories || []).some(
      (c: any) => c?.name === CATEGORIES.complementosSanValentin
    )
  );

  const byHandle = new Map<string, any>();
  const byNormTitle = new Map<string, any>();
  for (const p of targetProducts) {
    byHandle.set(String(p.handle), p);
    byNormTitle.set(normalizeTitle(String(p.title)), p);
  }

  let updated = 0;
  let missing = 0;

  for (const desired of complementosSanValentin as any[]) {
    const desiredHandle = toHandle(desired.title);
    const found =
      byHandle.get(desiredHandle) ??
      byNormTitle.get(normalizeTitle(desired.title));

    if (!found) {
      missing += 1;
      logger.warn(
        `No encontrado en DB para actualizar (se creará solo con seed:products): "${desired.title}"`
      );
      continue;
    }

    const images = (desired.images || []).map((url: string) => ({ url }));
    const thumbnail = desired.images?.[0] ?? null;
    const nextMetadata = {
      ...(found.metadata || {}),
      ...(desired.metadata || {}),
    };

    await productModuleService.updateProducts(found.id, {
      description: desired.description,
      images,
      thumbnail,
      metadata: nextMetadata,
    });

    // Actualizar precios de la variante (complementos tienen una sola variante)
    const variant = (found.variants || [])[0] as any;
    const priceSetId = variant?.price_set?.id;
    const ars = (desired as any).price?.ars?.base;
    const usd = (desired as any).price?.usd?.base;
    if (priceSetId != null && typeof ars === "number" && typeof usd === "number") {
      await pricingModuleService.updatePriceSets(priceSetId, {
        prices: [
          { amount: ars, currency_code: "ars" },
          { amount: usd, currency_code: "usd" },
        ],
      } as any);
      logger.info(`   Precios: ARS ${ars}, USD ${usd}`);
    }

    updated += 1;
    logger.info(`✅ Actualizado: ${desired.title} (${found.handle})`);
  }

  logger.info(`Resumen: actualizados=${updated}, sin match=${missing}.`);
}

