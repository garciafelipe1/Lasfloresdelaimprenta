import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import slugify from "slugify";

export default async function updateRosasNaranjasImages({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);

  const title = "Rosas Naranjas";
  const handle = slugify(title, { lower: true, trim: true });

  logger.info(`Searching for '${title}' product...`);

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "title"],
    filters: {
      handle: {
        $eq: handle,
      },
    },
  });

  if (!products?.length) {
    logger.error(`Product '${title}' not found! (handle: ${handle})`);
    return;
  }

  const product = products[0];

  const images = [
    { url: "/assets/img/productos/rosas/rosa-naranja-2.png" },
    { url: "/assets/img/productos/rosas/rosa-naranja-3.png" },
  ];

  await productModuleService.updateProducts(product.id, {
    images,
    thumbnail: images[0].url,
  });

  logger.info(`✅ Updated images for: ${product.title} (${product.handle})`);
}

