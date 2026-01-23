import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import slugify from "slugify";

export default async function verifyRosaAmarilla({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);

  logger.info("Searching for 'Rosas Amarillas' product...");

  const handle = slugify("Rosas Amarillas", { lower: true, trim: true });
  
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "title"],
    filters: {
      handle: {
        $eq: handle,
      },
    },
  });

  if (!products || products.length === 0) {
    logger.error("Product 'Rosas Amarillas' not found by handle!");

    logger.info("Searching by title (ilike '%Amarill%')...");
    const { data: maybeByTitle } = await query.graph({
      entity: "product",
      fields: ["id", "handle", "title", "thumbnail", "categories.name"],
      filters: {
        title: {
          $ilike: "%Amarill%",
        },
      },
    });

    if (maybeByTitle?.length) {
      logger.info("Found products by title:");
      maybeByTitle.forEach((p: any) => {
        logger.info(
          `- ${p.title} (handle: ${p.handle}) categories: ${(p.categories || [])
            .map((c: any) => c?.name)
            .filter(Boolean)
            .join(", ")} thumbnail: ${p.thumbnail ?? "null"}`
        );
      });
    } else {
      logger.warn("No products matched title filter.");
    }

    logger.info("Checking inventory items with sku like 'rosas-amarillas%'...");
    const { data: inv } = await query.graph({
      entity: "inventory_item",
      fields: ["id", "sku"],
      filters: {
        sku: {
          $ilike: "rosas-amarillas%",
        },
      },
    });

    if (inv?.length) {
      logger.warn(
        `Found ${inv.length} inventory_item(s) with sku prefix 'rosas-amarillas': ` +
          inv.map((i: any) => i.sku).join(", ")
      );
    } else {
      logger.info("No inventory items found with that sku prefix.");
    }

    return;
  }

  const product = products[0];
  logger.info(`Found product: ${product.title} (ID: ${product.id})`);

  // Obtener el producto completo con imágenes
  const fullProduct = await productModuleService.retrieveProduct(product.id, {
    relations: ["images"],
  });

  logger.info("=== PRODUCT IMAGES ===");
  if (fullProduct.images && fullProduct.images.length > 0) {
    fullProduct.images.forEach((img: any, index: number) => {
      logger.info(`Image ${index + 1}: ${img.url}`);
    });
  } else {
    logger.warn("⚠️ Product has NO images!");
  }

  // Intentar agregar la imagen si no existe
  const imageUrl = "/assets/img/productos/rosas/rosa-amarilla-1.png";
  const hasImage = fullProduct.images?.some((img: any) => img.url === imageUrl);

  if (!hasImage) {
    logger.info("Image not found. Attempting to add it...");
    
    const currentImages = (fullProduct.images || []).map((img: any) => ({ url: img.url }));
    const newImages = [...currentImages, { url: imageUrl }];
    
    try {
      await productModuleService.updateProducts(product.id, {
        images: newImages,
      });
      
      logger.info("✅ Image added successfully!");
      
      // Verificar nuevamente
      const updatedProduct = await productModuleService.retrieveProduct(product.id, {
        relations: ["images"],
      });
      
      logger.info("=== UPDATED PRODUCT IMAGES ===");
      if (updatedProduct.images && updatedProduct.images.length > 0) {
        updatedProduct.images.forEach((img: any, index: number) => {
          logger.info(`Image ${index + 1}: ${img.url}`);
        });
      } else {
        logger.error("❌ Still no images after update!");
      }
    } catch (error: any) {
      logger.error(`❌ Error updating images: ${error.message}`);
    }
  } else {
    logger.info("✅ Image already exists in product!");
  }
}
