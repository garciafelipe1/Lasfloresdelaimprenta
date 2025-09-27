import {
  CreateProductWorkflowInputDTO,
  MedusaContainer,
  ProductCategoryDTO,
} from "@medusajs/framework/types";
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

export async function SeedProducts(
  container: MedusaContainer,
  categories: ProductCategoryDTO[],
  shippingProfile: string,
  defaultSalesChannel: string
) {
  const buildBasicSeedProduct = (item: any) => ({
    title: item.title,
    description: item.description,
    category_ids: [categories.find((c) => c.name === item.category)!.id],
    handle: slugify(item.title, { lower: true, trim: true }),
    status: ProductStatus.PUBLISHED,
    shipping_profile_id: shippingProfile,
    images: item.images.map((image) => ({ url: image })),
    sales_channels: [{ id: defaultSalesChannel }],
  });

  const products1: CreateProductWorkflowInputDTO[] = [
    ...ramosPrimaverales,
    ...box,
    ...follaje,
    ...funebre,
  ].map((i) => ({
    ...buildBasicSeedProduct(i),
    options: [{ title: "Tamaño", values: SIZES }],
    variants: SIZES.map((size) => ({
      title: `${i.title} / ${size}`,
      sku: `${slugify(i.title, { lower: true, trim: true })}-${size}`,
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

  const rosasSeed = rosas.map((i) => ({
    ...buildBasicSeedProduct(i),
    options: [{ title: "Cantidad", values: ROSAS_QUANTITY }],
    variants: ROSAS_QUANTITY.map((cantidad) => ({
      title: `${i.title} / ${cantidad}`,
      sku: `${slugify(i.title, { lower: true, trim: true })}-${cantidad}`,
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

  const complementosSeed = complementos.map((i) => ({
    ...buildBasicSeedProduct(i),
    options: [{ title: i.variant.name, values: i.variant.options }],
    variants: i.variant.options.map((option) => ({
      title: `${i.title} / ${option}`,
      sku: `${slugify(i.title, { lower: true, trim: true })}-${option}`,
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

  const exclusivos: CreateProductWorkflowInputDTO[] = ramosExclusivos.map(
    (i) => ({
      ...buildBasicSeedProduct(i),
      options: [{ title: "Tamaño", values: ["Default"] }],
      variants: [
        {
          title: "Default",
          options: { Tamaño: "Default" },
        },
      ],
    })
  );

  // Seed "Ramos Primaverales, Box, Follaje y Funebre"
  await createProductsWorkflow(container).run({
    input: {
      products: [
        ...products1,
        ...rosasSeed,
        ...complementosSeed,
        ...exclusivos,
      ],
    },
  });
}
