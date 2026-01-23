import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import slugify from "slugify";

export default async function updateRosaAmarillaImage({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);

  logger.info("Searching for 'Rosas Amarillas' product...");

  // Buscar el producto por handle
  const handle = slugify("Rosas Amarillas", { lower: true, trim: true });
  
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "title", "images"],
    filters: {
      handle: {
        $eq: handle,
      },
    },
  });

  if (!products || products.length === 0) {
    logger.error("Product 'Rosas Amarillas' not found!");
    return;
  }

  const product = products[0];
  logger.info(`Found product: ${product.title} (ID: ${product.id})`);

  const newImageUrl = "/assets/img/productos/rosas/rosa-amarilla-1.png";
  
  // Obtener el producto completo con el módulo
  const fullProduct = await productModuleService.retrieveProduct(product.id, {
    relations: ["images"],
  });

  logger.info(`Current images count: ${fullProduct.images?.length || 0}`);

  // Verificar si la imagen ya existe
  const existingImages = (fullProduct.images || []).map((img: any) => img.url);
  const imageExists = existingImages.includes(newImageUrl);
  
  if (!imageExists) {
    logger.info("Adding new image...");
    
    // Crear la nueva imagen usando el módulo de productos
    const allImages = [
      ...(fullProduct.images || []).map((img: any) => ({ url: img.url })),
      { url: newImageUrl },
    ];
    
    await productModuleService.updateProducts({
      id: product.id,
      images: allImages,
    });

    logger.info("✅ Product 'Rosas Amarillas' updated successfully with image!");
    logger.info(`Total images now: ${allImages.length}`);
  } else {
    logger.info("✅ Image already exists in product!");
  }
}
