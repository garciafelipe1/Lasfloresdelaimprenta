import {
  CreateProductWorkflowInputDTO,
  MedusaContainer,
  ProductCategoryDTO,
} from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { ProductStatus } from "@medusajs/framework/utils";
import { createProductsWorkflow } from "@medusajs/medusa/core-flows";
import slugify from "slugify";

import { ROSAS_QUANTITY, SIZES } from "@/shared/constants";
import { box } from "./seed/products/box.seed";
import { complementos } from "./seed/products/complementos.seed";
import { ramosExclusivos } from "./seed/products/exclusivos.seed";
import { follaje } from "./seed/products/follaje.seed";
import { funebre } from "./seed/products/funebre.seed";
import { ramosPrimaverales } from "./seed/products/ramos-primaverales.seed";
import { rosas } from "./seed/products/rosas.seed";
import { sanValentin } from "./seed/products/san-valentin.seed";

export async function SeedProducts(
  container: MedusaContainer,
  categories: ProductCategoryDTO[],
  shippingProfile: string,
  defaultSalesChannel: string
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  // Evitar duplicados: si el producto ya existe por handle, se salta.
  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["handle"],
  });

  const existingHandles = new Set(
    (existingProducts || []).map((p: any) => p.handle)
  );

  // Evitar choques de inventario: si ya existe algún inventory_item con el SKU
  // que intentamos crear, salteamos ese producto para no fallar.
  const { data: existingInventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["sku"],
  });

  const existingSkus = new Set(
    (existingInventoryItems || [])
      .map((i: any) => i.sku)
      .filter((sku: any) => typeof sku === "string" && sku.length)
  );

  // Reservar SKUs para evitar colisiones (incluye los ya existentes + los generados en este run)
  const reservedSkus = new Set<string>(existingSkus);
  const uniqueSku = (preferredSku: string) => {
    if (!reservedSkus.has(preferredSku)) {
      reservedSkus.add(preferredSku);
      return preferredSku;
    }

    let i = 2;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const candidate = `${preferredSku}-${i}`;
      if (!reservedSkus.has(candidate)) {
        reservedSkus.add(candidate);
        return candidate;
      }
      i += 1;
    }
  };

  const shouldCreate = (title: string) =>
    !existingHandles.has(slugify(title, { lower: true, trim: true }));

  const buildBasicSeedProduct = (item: any) => ({
    title: item.title,
    description: item.description,
    category_ids: [categories.find((c) => c.name === item.category)!.id],
    handle: slugify(item.title, { lower: true, trim: true }),
    status: ProductStatus.PUBLISHED,
    shipping_profile_id: shippingProfile,
    thumbnail: item.images?.[0] ?? null,
    images: item.images.map((image) => ({ url: image })),
    sales_channels: [{ id: defaultSalesChannel }],
    metadata: item.metadata || {},
  });

  const products1: CreateProductWorkflowInputDTO[] = [
    ...ramosPrimaverales,
    ...box,
    ...follaje,
    ...funebre,
    ...sanValentin,
  ]
    .filter((i) => shouldCreate(i.title))
    .map((i) => ({
    ...buildBasicSeedProduct(i),
    options: [{ title: "Tamaño", values: SIZES }],
    variants: SIZES.map((size) => ({
      title: `${i.title} / ${size}`,
      sku: uniqueSku(`${slugify(i.title, { lower: true, trim: true })}-${size}`),
      options: { Tamaño: size },
      prices: [
        {
          amount: i.price.ars.base + SIZES.indexOf(size) * i.price.ars.aument,
          currency_code: "ars",
        },
        {
          amount: i.price.usd.base + SIZES.indexOf(size) * i.price.usd.aument,
          currency_code: "usd",
        },
      ],
    })),
  }));

  const rosasSeed = rosas
    .filter((i) => shouldCreate(i.title))
    .map((i) => ({
    ...buildBasicSeedProduct(i),
    options: [{ title: "Cantidad", values: ROSAS_QUANTITY }],
    variants: ROSAS_QUANTITY.map((cantidad) => ({
      title: `${i.title} / ${cantidad}`,
      sku: uniqueSku(
        `${slugify(i.title, { lower: true, trim: true })}-${cantidad}`
      ),
      options: { Cantidad: cantidad },
      prices: [
        {
          amount: i.price.ars.base * parseInt(cantidad),
          currency_code: "ars",
        },
        {
          amount: i.price.usd.base * parseInt(cantidad),
          currency_code: "usd",
        },
      ],
    })),
  }));

  const complementosSeed = complementos
    .filter((i) => shouldCreate(i.title))
    .map((i) => ({
    ...buildBasicSeedProduct(i),
    options: [{ title: i.variant.name, values: i.variant.options }],
    variants: i.variant.options.map((option) => ({
      title: `${i.title} / ${option}`,
      sku: uniqueSku(`${slugify(i.title, { lower: true, trim: true })}-${option}`),
      options: { [i.variant.name]: option },
      prices: [
        {
          amount:
            i.price.ars.base +
            i.variant.options.indexOf(option) * i.price.ars.aument,
          currency_code: "ars",
        },
        {
          amount:
            i.price.usd.base +
            i.variant.options.indexOf(option) * i.price.ars.aument,
          currency_code: "usd",
        },
      ],
    })),
  }));

  const exclusivos: CreateProductWorkflowInputDTO[] = ramosExclusivos
    .filter((i) => shouldCreate(i.title))
    .map((i) => ({
      ...buildBasicSeedProduct(i),
      options: [{ title: "Tamaño", values: ["Default"] }],
      variants: [
        {
          title: "Default",
          options: { Tamaño: "Default" },
        },
      ],
    }));

  const productsToCreate = [
    ...products1,
    ...rosasSeed,
    ...complementosSeed,
    ...exclusivos,
  ];

  if (!productsToCreate.length) {
    return;
  }

  // Seed "Ramos Primaverales, Box, Follaje y Funebre"
  await createProductsWorkflow(container).run({
    input: {
      products: productsToCreate,
    },
  });
}
