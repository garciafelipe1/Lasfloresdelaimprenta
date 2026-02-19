import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows";
import { CATEGORIES } from "@/shared/constants";

/**
 * Migra productos de "Día de la Madre" a "Día de la Mujer"
 * y de "Complemento Día de la Madre" a "Complemento Día de la Mujer"
 *
 * - Busca productos en las categorías antiguas
 * - Crea las nuevas categorías si no existen
 * - Mueve los productos a las nuevas categorías
 * - No borra productos, solo actualiza sus categorías
 */
export default async function moveDiaMadreToDiaMujer({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);

  logger.info("[move-dia-madre-to-dia-mujer] Iniciando migración...");

  // Obtener todas las categorías existentes
  const { data: existingCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
  });

  const categories = (existingCategories || []) as any[];

  // Categorías a migrar
  const oldCategoryName = "Día de la Madre";
  const newCategoryName = CATEGORIES.sanValentin; // "Día de la Mujer"
  const oldComplementoName = "Complemento Día de la Madre";
  const newComplementoName = CATEGORIES.complementosSanValentin; // "Complemento Día de la Mujer"

  // Buscar o crear la nueva categoría principal
  let diaMujerCategory = categories.find((c: any) => c.name === newCategoryName);
  if (!diaMujerCategory) {
    logger.info(`[move-dia-madre-to-dia-mujer] Creando categoría "${newCategoryName}"...`);
    const { result: created } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: [
          {
            name: newCategoryName,
            is_active: true,
          },
        ],
      },
    });
    diaMujerCategory = (created as any[])[0];
    logger.info(`[move-dia-madre-to-dia-mujer] ✅ Categoría "${newCategoryName}" creada (id: ${diaMujerCategory.id})`);
  } else {
    logger.info(`[move-dia-madre-to-dia-mujer] ✅ Categoría "${newCategoryName}" ya existe (id: ${diaMujerCategory.id})`);
  }

  // Buscar o crear la nueva categoría de complementos
  let complementoDiaMujerCategory = categories.find((c: any) => c.name === newComplementoName);
  if (!complementoDiaMujerCategory) {
    logger.info(`[move-dia-madre-to-dia-mujer] Creando categoría "${newComplementoName}"...`);
    const { result: created } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: [
          {
            name: newComplementoName,
            is_active: true,
          },
        ],
      },
    });
    complementoDiaMujerCategory = (created as any[])[0];
    logger.info(`[move-dia-madre-to-dia-mujer] ✅ Categoría "${newComplementoName}" creada (id: ${complementoDiaMujerCategory.id})`);
  } else {
    logger.info(`[move-dia-madre-to-dia-mujer] ✅ Categoría "${newComplementoName}" ya existe (id: ${complementoDiaMujerCategory.id})`);
  }

  // Obtener todos los productos con sus categorías
  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "categories.id",
      "categories.name",
    ],
  });

  // Filtrar productos en "Día de la Madre"
  const diaMadreProducts = (products || []).filter((p: any) =>
    (p?.categories || []).some((c: any) => c?.name === oldCategoryName)
  );

  // Filtrar productos en "Complemento Día de la Madre"
  const complementoDiaMadreProducts = (products || []).filter((p: any) =>
    (p?.categories || []).some((c: any) => c?.name === oldComplementoName)
  );

  logger.info(
    `[move-dia-madre-to-dia-mujer] Encontrados ${diaMadreProducts.length} productos en "${oldCategoryName}"`
  );
  logger.info(
    `[move-dia-madre-to-dia-mujer] Encontrados ${complementoDiaMadreProducts.length} productos en "${oldComplementoName}"`
  );

  let moved = 0;
  let skipped = 0;

  // Mover productos de "Día de la Madre" a "Día de la Mujer"
  for (const product of diaMadreProducts as any[]) {
    const currentCategories = (product.categories || []) as any[];
    const currentCategoryIds = currentCategories.map((c: any) => c.id).filter(Boolean);
    
    // Verificar si ya está en la nueva categoría
    const alreadyInNewCategory = currentCategories.some((c: any) => c.name === newCategoryName);
    if (alreadyInNewCategory) {
      logger.info(
        `[move-dia-madre-to-dia-mujer] ⏭️  Saltando: ${product.title} - ya está en "${newCategoryName}"`
      );
      skipped++;
      continue;
    }

    // Remover la categoría antigua y agregar la nueva
    const oldCategory = currentCategories.find((c: any) => c.name === oldCategoryName);
    const newCategoryIds = currentCategoryIds.filter((id: string) => id !== oldCategory?.id);
    newCategoryIds.push(diaMujerCategory.id);

    try {
      await productModuleService.updateProducts(String(product.id), {
        category_ids: newCategoryIds,
      } as any);

      moved++;
      logger.info(
        `[move-dia-madre-to-dia-mujer] ✅ Movido: "${product.title}" de "${oldCategoryName}" a "${newCategoryName}"`
      );
    } catch (error: any) {
      logger.error(
        `[move-dia-madre-to-dia-mujer] ❌ Error moviendo ${product.title}: ${error.message}`
      );
    }
  }

  // Mover productos de "Complemento Día de la Madre" a "Complemento Día de la Mujer"
  for (const product of complementoDiaMadreProducts as any[]) {
    const currentCategories = (product.categories || []) as any[];
    const currentCategoryIds = currentCategories.map((c: any) => c.id).filter(Boolean);
    
    // Verificar si ya está en la nueva categoría
    const alreadyInNewCategory = currentCategories.some((c: any) => c.name === newComplementoName);
    if (alreadyInNewCategory) {
      logger.info(
        `[move-dia-madre-to-dia-mujer] ⏭️  Saltando: ${product.title} - ya está en "${newComplementoName}"`
      );
      skipped++;
      continue;
    }

    // Remover la categoría antigua y agregar la nueva
    const oldCategory = currentCategories.find((c: any) => c.name === oldComplementoName);
    const newCategoryIds = currentCategoryIds.filter((id: string) => id !== oldCategory?.id);
    newCategoryIds.push(complementoDiaMujerCategory.id);

    try {
      await productModuleService.updateProducts(String(product.id), {
        category_ids: newCategoryIds,
      } as any);

      moved++;
      logger.info(
        `[move-dia-madre-to-dia-mujer] ✅ Movido: "${product.title}" de "${oldComplementoName}" a "${newComplementoName}"`
      );
    } catch (error: any) {
      logger.error(
        `[move-dia-madre-to-dia-mujer] ❌ Error moviendo ${product.title}: ${error.message}`
      );
    }
  }

  logger.info(
    `[move-dia-madre-to-dia-mujer] ✅ Completado. Movidos: ${moved}, Saltados: ${skipped}`
  );
}

