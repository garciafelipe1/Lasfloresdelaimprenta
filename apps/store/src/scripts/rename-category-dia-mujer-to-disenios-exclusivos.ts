/**
 * Migración: mueve productos de categorías legacy a "Diseños Exclusivos" y "Complementos Exclusivos".
 *
 * - Idempotente: se puede ejecutar varias veces sin duplicar.
 * - DRY_RUN=true (por defecto): solo lista qué se haría.
 * - DRY_RUN=false: mueve los productos (crea categorías nuevas si no existen).
 *
 * Uso: pnpm run migrate:dia-mujer-to-disenios-exclusivos
 *      DRY_RUN=false pnpm run migrate:dia-mujer-to-disenios-exclusivos
 */
import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows";
import { CATEGORIES, LEGACY_CATEGORIES } from "@/shared/constants";

export default async function renameCategoryDiaMujerToDiseniosExclusivos({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);

  const dryRun = String(process.env.DRY_RUN ?? "true").toLowerCase() === "true";
  const oldMainName = LEGACY_CATEGORIES.diaDeLaMujer;
  const oldComplementoName = LEGACY_CATEGORIES.complementoDiaDeLaMujer;
  const newMainName = CATEGORIES.sanValentin;
  const newComplementoName = CATEGORIES.complementosSanValentin;

  logger.info(
    `[migrate-categories] Iniciando. DRY_RUN=${dryRun} | ${oldMainName} → ${newMainName}, ${oldComplementoName} → ${newComplementoName}`
  );

  const { data: existingCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
  });

  const categories = (existingCategories || []) as { id: string; name: string }[];

  let newMainCategory = categories.find((c) => c.name === newMainName);
  if (!newMainCategory && !dryRun) {
    const { result: created } = await createProductCategoriesWorkflow(container).run({
      input: { product_categories: [{ name: newMainName, is_active: true }] },
    });
    newMainCategory = (created as { id: string; name: string }[])[0];
    logger.info(`[migrate-categories] Categoría creada: "${newMainName}" (${newMainCategory.id})`);
  } else if (!newMainCategory && dryRun) {
    logger.info(`[migrate-categories] (DRY_RUN) Se crearía categoría "${newMainName}"`);
  } else if (newMainCategory) {
    logger.info(`[migrate-categories] Categoría existente: "${newMainName}" (${newMainCategory.id})`);
  }

  let newComplementoCategory = categories.find((c) => c.name === newComplementoName);
  if (!newComplementoCategory && !dryRun) {
    const { result: created } = await createProductCategoriesWorkflow(container).run({
      input: { product_categories: [{ name: newComplementoName, is_active: true }] },
    });
    newComplementoCategory = (created as { id: string; name: string }[])[0];
    logger.info(`[migrate-categories] Categoría creada: "${newComplementoName}" (${newComplementoCategory.id})`);
  } else if (!newComplementoCategory && dryRun) {
    logger.info(`[migrate-categories] (DRY_RUN) Se crearía categoría "${newComplementoName}"`);
  } else if (newComplementoCategory) {
    logger.info(`[migrate-categories] Categoría existente: "${newComplementoName}" (${newComplementoCategory.id})`);
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "categories.id", "categories.name"],
  });

  const mainProducts = (products || []).filter((p: any) =>
    (p?.categories || []).some((c: any) => c?.name === oldMainName)
  );
  const complementoProducts = (products || []).filter((p: any) =>
    (p?.categories || []).some((c: any) => c?.name === oldComplementoName)
  );

  logger.info(`[migrate-categories] Productos en "${oldMainName}": ${mainProducts.length}`);
  logger.info(`[migrate-categories] Productos en "${oldComplementoName}": ${complementoProducts.length}`);

  if (dryRun) {
    mainProducts.forEach((p: any) => logger.info(`[migrate-categories] (DRY_RUN) Movería: ${p.title}`));
    complementoProducts.forEach((p: any) => logger.info(`[migrate-categories] (DRY_RUN) Movería: ${p.title}`));
    logger.info(`[migrate-categories] DRY_RUN finalizado. Ejecutá con DRY_RUN=false para aplicar.`);
    return;
  }

  if (!newMainCategory || !newComplementoCategory) {
    logger.warn("[migrate-categories] Faltan categorías destino. Abortando.");
    return;
  }

  let moved = 0;

  for (const product of mainProducts as any[]) {
    const currentCategories = (product.categories || []) as any[];
    if (currentCategories.some((c: any) => c.name === newMainName)) continue;

    const oldCat = currentCategories.find((c: any) => c.name === oldMainName);
    const newCategoryIds = currentCategories
      .map((c: any) => c.id)
      .filter((id: string) => id !== oldCat?.id);
    newCategoryIds.push(newMainCategory!.id);

    try {
      await productModuleService.updateProducts(String(product.id), {
        category_ids: newCategoryIds,
      } as any);
      moved++;
      logger.info(`[migrate-categories] ✅ ${product.title} → "${newMainName}"`);
    } catch (err: any) {
      logger.error(`[migrate-categories] ❌ ${product.title}: ${err.message}`);
    }
  }

  for (const product of complementoProducts as any[]) {
    const currentCategories = (product.categories || []) as any[];
    if (currentCategories.some((c: any) => c.name === newComplementoName)) continue;

    const oldCat = currentCategories.find((c: any) => c.name === oldComplementoName);
    const newCategoryIds = currentCategories
      .map((c: any) => c.id)
      .filter((id: string) => id !== oldCat?.id);
    newCategoryIds.push(newComplementoCategory!.id);

    try {
      await productModuleService.updateProducts(String(product.id), {
        category_ids: newCategoryIds,
      } as any);
      moved++;
      logger.info(`[migrate-categories] ✅ ${product.title} → "${newComplementoName}"`);
    } catch (err: any) {
      logger.error(`[migrate-categories] ❌ ${product.title}: ${err.message}`);
    }
  }

  logger.info(`[migrate-categories] Completado. Productos movidos: ${moved}`);
}
