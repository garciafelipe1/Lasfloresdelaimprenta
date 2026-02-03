import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

export default async function updateDulceComplicidadImage({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);

  const handle = "dulce-complicidad";

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
    logger.error(`Producto no encontrado (handle: ${handle})`);
    return;
  }

  const product = products[0];
  const images = [{ url: "/assets/img/productos/san-valentin/dulce-complicidad-1.jpg" }];

  await productModuleService.updateProducts(product.id, {
    images,
    thumbnail: images[0].url,
  });

  logger.info(`✅ Imagen actualizada para: ${product.title} (${product.handle})`);
}

