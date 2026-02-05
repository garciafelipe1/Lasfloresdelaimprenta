import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { createProductsWorkflow } from "@medusajs/medusa/core-flows";
import { ProductStatus } from "@medusajs/framework/utils";
import slugify from "slugify";
import { ROSAS_QUANTITY } from "@/shared/constants";

export default async function recreateRosaAmarilla({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);

  logger.info("Searching for 'Rosas Amarillas' product...");

  const handle = slugify("Rosas Amarillas", { lower: true, trim: true });

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
    filters: {
      handle: {
        $eq: handle,
      },
    },
  });

  if (products && products.length > 0) {
    logger.info(`Deleting existing product: ${products[0].id}`);
    await productModuleService.deleteProducts([products[0].id]);
    logger.info("✅ Product deleted");
  }

  logger.info("Creating new product with image...");

  // Obtener datos necesarios
  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
  });

  const rosasCategory = categories.find((c: any) => c.name === "Rosas");
  if (!rosasCategory) {
    throw new Error("Category 'Rosas' not found!");
  }

  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });

  const defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  const productData = {
    title: "Rosas Amarillas",
    description:
      "<p>Radiantes <em>rosas amarillas</em> que transmiten alegría, amistad y felicidad. Perfectas para celebrar logros, expresar gratitud o simplemente alegrar el día de alguien especial. Su color brillante y energético las hace únicas.</p>",
    category_ids: [rosasCategory.id],
    handle: handle,
    status: ProductStatus.PUBLISHED,
    shipping_profile_id: shippingProfiles[0].id,
    images: [
      { url: "/assets/img/productos/rosas/rosa-amarilla-1.png" },
    ],
    sales_channels: [{ id: defaultSalesChannel[0].id }],
    metadata: {
      color: "Amarillo",
    },
    options: [{ title: "Cantidad", values: ROSAS_QUANTITY }],
    variants: ROSAS_QUANTITY.map((cantidad) => ({
      title: `Rosas Amarillas / ${cantidad}`,
      sku: `${handle}-${cantidad}`,
      options: { Cantidad: cantidad },
      prices: [
        {
          amount: 1500 * parseInt(cantidad),
          currency_code: "ars",
        },
        {
          amount: 5 * parseInt(cantidad),
          currency_code: "usd",
        },
      ],
    })),
  };

  await createProductsWorkflow(container).run({
    input: {
      products: [productData],
    },
  });

  logger.info("✅ Product 'Rosas Amarillas' recreated successfully with image!");
}
