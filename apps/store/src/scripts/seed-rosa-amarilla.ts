import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  createProductCategoriesWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows";
import { ProductStatus } from "@medusajs/framework/utils";
import slugify from "slugify";

import { CATEGORIES, ROSAS_QUANTITY } from "@/shared/constants";
import { rosas } from "./seed/products/rosas.seed";

/**
 * Seed de un solo producto (Rosas Amarillas).
 * NO crea regiones ni toca configuración de países.
 *
 * Ejecutar:
 * pnpm medusa exec ./src/scripts/seed-rosa-amarilla.ts
 */
export default async function seedRosaAmarilla({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);

  const productToSeed = rosas.find((p) => p.title === "Rosas Amarillas");
  if (!productToSeed) {
    throw new Error('No se encontró "Rosas Amarillas" en rosas.seed.ts');
  }

  logger.info('Seeding "Rosas Amarillas" (sin tocar regiones)...');

  // Categorías existentes (crear "Rosas" si no existe)
  const { data: existingCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
  });

  let categories = (existingCategories || []) as any[];
  const rosasCategory = categories.find((c: any) => c.name === CATEGORIES.rosas);

  if (!rosasCategory) {
    logger.info(`Category "${CATEGORIES.rosas}" not found. Creating it...`);
    const { result: categoryResult } =
      await createProductCategoriesWorkflow(container).run({
        input: {
          product_categories: [
            {
              name: CATEGORIES.rosas,
              is_active: true,
            },
          ],
        },
      });
    categories = [...categories, ...(categoryResult as any[])];
    logger.info(`✅ Category "${CATEGORIES.rosas}" created.`);
  }

  // Shipping profile (debe existir)
  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });

  if (!shippingProfiles || shippingProfiles.length === 0) {
    throw new Error(
      "No se encontró shipping profile. Creá uno (o corré el seed inicial una sola vez en una DB vacía)."
    );
  }

  // Sales channel default (debe existir)
  const defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  if (!defaultSalesChannel.length) {
    throw new Error(
      'No se encontró "Default Sales Channel". Crealo primero en el admin.'
    );
  }

  // Evitar duplicados por handle
  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["handle"],
  });

  const existingHandles = new Set(
    (existingProducts || []).map((p: any) => p.handle)
  );

  const handle = slugify(productToSeed.title, { lower: true, trim: true });
  if (existingHandles.has(handle)) {
    logger.info(
      `El producto "${productToSeed.title}" ya existe (handle: ${handle}). No se creó nada.`
    );
    return;
  }

  const category = categories.find((c: any) => c.name === productToSeed.category);
  if (!category) {
    throw new Error(`Category "${productToSeed.category}" not found.`);
  }

  const product = {
    title: productToSeed.title,
    description: productToSeed.description,
    category_ids: [category.id],
    handle,
    status: ProductStatus.PUBLISHED,
    shipping_profile_id: shippingProfiles[0].id,
    images: productToSeed.images.map((url: string) => ({ url })),
    sales_channels: [{ id: defaultSalesChannel[0].id }],
    metadata: productToSeed.metadata || {},
    options: [{ title: "Cantidad", values: ROSAS_QUANTITY }],
    variants: ROSAS_QUANTITY.map((cantidad) => ({
      title: `${productToSeed.title} / ${cantidad}`,
      sku: `${handle}-${cantidad}`,
      options: { Cantidad: cantidad },
      prices: [
        {
          amount: productToSeed.price.ars.base * parseInt(cantidad, 10),
          currency_code: "ars",
        },
        {
          amount: productToSeed.price.usd.base * parseInt(cantidad, 10),
          currency_code: "usd",
        },
      ],
    })),
  };

  await createProductsWorkflow(container).run({
    input: {
      products: [product],
    },
  });

  logger.info(`✅ Producto creado: ${productToSeed.title}`);
}

