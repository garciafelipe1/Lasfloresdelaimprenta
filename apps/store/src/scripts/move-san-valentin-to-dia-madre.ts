import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows";
import { CATEGORIES } from "@/shared/constants";

/**
 * Mueve todos los productos de "San Valentín" a "Día de la Madre"
 * y de "Complementos de San Valentín" a "Complemento Día de la Madre"
 * 
 * Este script:
 * 1. Busca todos los productos en "San Valentín" y los mueve a "Día de la Madre"
 * 2. Busca todos los productos en "Complementos de San Valentín" y los mueve a "Complemento Día de la Madre"
 * 3. No borra productos, solo cambia su categoría
 */
export default async function moveSanValentinToDiaMadre({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);

  // Obtener todas las categorías
  let { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
  });

  const categoryMap = new Map<string, string>();
  (categories || []).forEach((c: any) => {
    categoryMap.set(c.name, c.id);
  });

  // IDs de categorías
  const sanValentinId = categoryMap.get("San Valentín");
  let diaMadreId = categoryMap.get("Día de la Madre");
  const complementosSanValentinId = categoryMap.get("Complementos de San Valentín");
  let complementoDiaMadreId = categoryMap.get("Complemento Día de la Madre");

  // Crear "Día de la Madre" si no existe
  if (!diaMadreId) {
    logger.info("Creando categoría 'Día de la Madre'...");
    const { result: created } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: [{
          name: "Día de la Madre",
          is_active: true,
        }],
      },
    });
    const newCategory = (created as any[])?.[0];
    if (newCategory?.id) {
      diaMadreId = newCategory.id;
      categoryMap.set("Día de la Madre", diaMadreId);
      logger.info(`✅ Categoría 'Día de la Madre' creada con ID: ${diaMadreId}`);
    } else {
      logger.error("No se pudo crear la categoría 'Día de la Madre'.");
      return;
    }
  }

  // Crear "Complemento Día de la Madre" si no existe
  if (!complementoDiaMadreId) {
    logger.info("Creando categoría 'Complemento Día de la Madre'...");
    const { result: created } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: [{
          name: "Complemento Día de la Madre",
          is_active: true,
        }],
      },
    });
    const newCategory = (created as any[])?.[0];
    if (newCategory?.id) {
      complementoDiaMadreId = newCategory.id;
      categoryMap.set("Complemento Día de la Madre", complementoDiaMadreId);
      logger.info(`✅ Categoría 'Complemento Día de la Madre' creada con ID: ${complementoDiaMadreId}`);
    } else {
      logger.error("No se pudo crear la categoría 'Complemento Día de la Madre'.");
      return;
    }
  }

  // Refrescar lista de categorías
  const { data: updatedCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
  });
  categories = updatedCategories;

  // Obtener todos los productos
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "categories.id", "categories.name"],
  });

  let movedSanValentin = 0;
  let movedComplementos = 0;

  for (const product of (products || []) as any[]) {
    const productCategories = product.categories || [];
    const categoryNames = productCategories.map((c: any) => c.name);
    const categoryIds = productCategories.map((c: any) => c.id).filter(Boolean);

    let updatedCategoryIds = [...categoryIds];
    let needsUpdate = false;

    // Si el producto está en "San Valentín", moverlo a "Día de la Madre"
    if (sanValentinId && categoryIds.includes(sanValentinId)) {
      // Remover "San Valentín"
      updatedCategoryIds = updatedCategoryIds.filter((id: string) => id !== sanValentinId);
      // Agregar "Día de la Madre" si no está
      if (!updatedCategoryIds.includes(diaMadreId)) {
        updatedCategoryIds.push(diaMadreId);
      }
      needsUpdate = true;
      movedSanValentin++;
    }

    // Si el producto está en "Complementos de San Valentín", moverlo a "Complemento Día de la Madre"
    if (complementosSanValentinId && categoryIds.includes(complementosSanValentinId)) {
      // Remover "Complementos de San Valentín"
      updatedCategoryIds = updatedCategoryIds.filter((id: string) => id !== complementosSanValentinId);
      // Agregar "Complemento Día de la Madre" si no está
      if (!updatedCategoryIds.includes(complementoDiaMadreId)) {
        updatedCategoryIds.push(complementoDiaMadreId);
      }
      needsUpdate = true;
      movedComplementos++;
    }

    // Si necesita actualización, actualizar el producto
    if (needsUpdate) {
      await productModuleService.updateProducts(String(product.id), {
        category_ids: updatedCategoryIds,
      } as any);

      const newCategoryNames = updatedCategoryIds.map((id: string) => {
        const cat = (categories || []).find((c: any) => c.id === id);
        return cat?.name || id;
      });

      logger.info(
        `✅ Movido: ${product.title} (${product.handle}) - Categorías: ${categoryNames.join(", ")} → ${newCategoryNames.join(", ")}`
      );
    }
  }

  logger.info(`✅ Movidos ${movedSanValentin} productos de "San Valentín" a "Día de la Madre"`);
  logger.info(`✅ Movidos ${movedComplementos} productos de "Complementos de San Valentín" a "Complemento Día de la Madre"`);
  logger.info("✅ Migración completada.");
}

