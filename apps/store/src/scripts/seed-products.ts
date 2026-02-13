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
import { complementosSanValentin } from "./seed/products/complementos-san-valentin.seed";
import { follaje } from "./seed/products/follaje.seed";
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

  // ✅ Variaciones específicas por categoría (NO tocar constantes globales)
  const SPRING_SIZES = ["S", "M", "L", "XL", "XXL"] as const;
  const SPRING_SIZE_PRICE_ARS: Record<(typeof SPRING_SIZES)[number], number> = {
    S: 50_000,
    M: 75_000,
    L: 95_000,
    XL: 135_000,
    XXL: 170_000,
  };
  // USD “de referencia” para no dejar el producto sin precios en USD (conversión simple)
  const SPRING_SIZE_PRICE_USD: Record<(typeof SPRING_SIZES)[number], number> = {
    S: 50,
    M: 75,
    L: 95,
    XL: 135,
    XXL: 170,
  };

  // ✅ Rosas + San Valentín (catálogo): variaciones X* con precios ARS fijos
  const X_VARIATIONS = [
    { label: "X3", ars: 50_000, usd: 50 },
    { label: "X6", ars: 84_000, usd: 84 },
    { label: "X6 + 1 Lilium", ars: 94_000, usd: 94 },
    { label: "X12", ars: 154_000, usd: 154 },
    { label: "X12 + 1 Lilium", ars: 164_000, usd: 164 },
    { label: "X14", ars: 175_000, usd: 175 },
    { label: "X24", ars: 297_000, usd: 297 },
  ] as const;

  // Handle/SKU deben ser URL-safe (sin apóstrofes, tildes, etc.)
  const toHandle = (value: string) =>
    slugify(value, { lower: true, trim: true, strict: true });

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
    !existingHandles.has(toHandle(title));

  const buildBasicSeedProduct = (item: any) => ({
    title: item.title,
    description: item.description,
    category_ids: [categories.find((c) => c.name === item.category)!.id],
    handle: toHandle(item.title),
    status: ProductStatus.PUBLISHED,
    shipping_profile_id: shippingProfile,
    thumbnail: item.images?.[0] ?? null,
    images: item.images.map((image) => ({ url: image })),
    sales_channels: [{ id: defaultSalesChannel }],
    metadata: item.metadata || {},
  });

  const products1: CreateProductWorkflowInputDTO[] = ([
    ...ramosPrimaverales,
    ...box,
    ...follaje,
    ...sanValentin,
  ] as any[])
    .filter((i) => shouldCreate(i.title))
    .map((i) => ({
      ...buildBasicSeedProduct(i),
      ...(i.category === "San Valentín"
        ? {
          options: [
            {
              title: "Cantidad",
              values: X_VARIATIONS.map((v) => v.label),
            },
          ],
          variants: X_VARIATIONS.map((v) => ({
            title: `${i.title} / ${v.label}`,
            sku: uniqueSku(`${toHandle(i.title)}-${v.label}`),
            options: { Cantidad: v.label },
            prices: [
              { amount: v.ars, currency_code: "ars" },
              { amount: v.usd, currency_code: "usd" },
            ],
          })),
        }
        : i.category === "Box"
          ? {
            options: [{ title: "Presentación", values: ["Default"] }],
            variants: [
              {
                title: "Default",
                sku: uniqueSku(`${toHandle(i.title)}-default`),
                options: { Presentación: "Default" },
                prices: [
                  { amount: i.price.ars.base, currency_code: "ars" },
                  { amount: i.price.usd.base, currency_code: "usd" },
                ],
              },
            ],
          }
          : {
            options: [
              {
                title: "Tamaño",
                values:
                  i.category === "Ramos primaverales"
                    ? [...SPRING_SIZES]
                    : SIZES,
              },
            ],
            variants:
              i.category === "Ramos primaverales"
                ? [...SPRING_SIZES].map((size) => ({
                  title: `${i.title} / ${size}`,
                  sku: uniqueSku(`${toHandle(i.title)}-${size}`),
                  options: { Tamaño: size },
                  prices: [
                    { amount: SPRING_SIZE_PRICE_ARS[size], currency_code: "ars" },
                    { amount: SPRING_SIZE_PRICE_USD[size], currency_code: "usd" },
                  ],
                }))
                : SIZES.map((size) => ({
                  title: `${i.title} / ${size}`,
                  sku: uniqueSku(`${toHandle(i.title)}-${size}`),
                  options: { Tamaño: size },
                  prices: [
                    {
                      amount:
                        i.price.ars.base +
                        SIZES.indexOf(size) * i.price.ars.aument,
                      currency_code: "ars",
                    },
                    {
                      amount:
                        i.price.usd.base +
                        SIZES.indexOf(size) * i.price.usd.aument,
                      currency_code: "usd",
                    },
                  ],
                })),
          }),
    })) as any;

  const rosasSeed = rosas
    .filter((i) => shouldCreate(i.title))
    .map((i) => ({
      ...(i as any).metadata?.exclusive
        ? {
          ...buildBasicSeedProduct(i),
          options: [{ title: "Presentación", values: ["Default"] }],
          variants: [
            {
              title: "Default",
              sku: uniqueSku(`${toHandle(i.title)}-default`),
              options: { Presentación: "Default" },
              prices: [
                { amount: i.price.ars.base, currency_code: "ars" },
                { amount: i.price.usd.base, currency_code: "usd" },
              ],
            },
          ],
        }
        : {
          ...buildBasicSeedProduct(i),
          options: [{ title: "Cantidad", values: X_VARIATIONS.map((v) => v.label) }],
          variants: X_VARIATIONS.map((v) => ({
            title: `${i.title} / ${v.label}`,
            sku: uniqueSku(`${toHandle(i.title)}-${v.label}`),
            options: { Cantidad: v.label },
            prices: [
              { amount: v.ars, currency_code: "ars" },
              { amount: v.usd, currency_code: "usd" },
            ],
          })),
        },
    }));

  const complementosSeed = complementos
    .filter((i) => shouldCreate(i.title))
    .map((i) => ({
      ...buildBasicSeedProduct(i),
      options: [{ title: i.variant.name, values: i.variant.options }],
      variants: i.variant.options.map((option) => ({
        title: `${i.title} / ${option}`,
        sku: uniqueSku(`${toHandle(i.title)}-${option}`),
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

  const complementosSanValentinSeed: CreateProductWorkflowInputDTO[] =
    complementosSanValentin
      .filter((i) => shouldCreate(i.title))
      .map((i) => ({
        ...buildBasicSeedProduct(i),
        options: [{ title: "Presentación", values: ["Default"] }],
        variants: [
          {
            title: "Default",
            sku: uniqueSku(`${toHandle(i.title)}-default`),
            options: { Presentación: "Default" },
            prices: [
              { amount: i.price.ars.base, currency_code: "ars" },
              { amount: i.price.usd.base, currency_code: "usd" },
            ],
          },
        ],
      }));

  const productsToCreate = [
    ...products1,
    ...rosasSeed,
    ...complementosSeed,
    ...complementosSanValentinSeed,
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
