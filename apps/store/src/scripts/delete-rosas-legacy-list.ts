import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
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

const TARGET_TITLES = [
  "Rosas Rosas",
  "Rosas Premium",
  "Rosas Naranjas",
  "Rosas Blancas",
  "Rosas Rojas",
  "Rosas Nacionales",
  "Rosas Amarillas",
];

/**
 * Borra SOLO los productos legacy indicados en TARGET_TITLES.
 *
 * DRY_RUN=true por defecto.
 * - DRY_RUN=true  -> lista
 * - DRY_RUN=false -> borra
 */
export default async function deleteRosasLegacyList({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);

  const dryRun = String(process.env.DRY_RUN ?? "true").toLowerCase() !== "false";

  const targets = TARGET_TITLES.map((title) => ({
    title,
    norm: normalizeTitle(title),
    handle: toHandle(title),
    skuPrefix: `${toHandle(title)}-`,
  }));

  logger.info(`Modo: ${dryRun ? "DRY_RUN (no borra)" : "BORRADO REAL"}`);
  logger.info("Objetivo (solo estos):");
  targets.forEach((t) =>
    logger.info(`- ${t.title} (handle: ${t.handle}, skuPrefix: ${t.skuPrefix})`)
  );

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "variants.sku"],
  });

  const candidates = (products || []).filter((p: any) => {
    const normTitle = normalizeTitle(String(p?.title ?? ""));
    const handle = String(p?.handle ?? "");
    const skus = (p?.variants || [])
      .map((v: any) => v?.sku)
      .filter((s: any) => typeof s === "string");

    return targets.some((t) => {
      if (handle === t.handle) return true;
      if (normTitle === t.norm) return true;
      return skus.some((sku: string) => sku === t.handle || sku.startsWith(t.skuPrefix));
    });
  });

  if (!candidates.length) {
    logger.info("No se encontraron esos productos para borrar.");
    return;
  }

  logger.info(`Encontrados ${candidates.length} producto(s) para borrar:`);
  candidates.forEach((p: any) =>
    logger.info(`- ${p.title} (handle: ${p.handle}, id: ${p.id})`)
  );

  if (dryRun) {
    logger.info("DRY_RUN=true → no se borró nada.");
    return;
  }

  for (const p of candidates) {
    await productModuleService.deleteProducts(p.id);
    logger.info(`✅ Borrado: ${p.title} (${p.handle})`);
  }
}

