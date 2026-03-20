import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

/**
 * Actualiza imágenes/thumbnail de los productos Box vigentes en catálogo.
 * (Sin "fresh-vibrant": producto retirado — ver script delete:fresh-vibrant.)
 *
 * Nota: esto NO crea productos. Solo actualiza los existentes por handle.
 * Útil porque el seed de productos suele "saltear" si ya existen.
 */
export default async function updateBoxImages({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);

  const R2_BASE = "https://pub-43da7721872a46ffac4397d05373bc0d.r2.dev";
  const mapping: Array<{ handle: string; imageUrl: string }> = [
    {
      handle: "lilium-and-violet",
      imageUrl: `${R2_BASE}/lilium.jpeg`,
    },
    {
      handle: "edicion-silvestre",
      imageUrl: `${R2_BASE}/silvestre.png`,
    },
    {
      handle: "pink-symphony",
      imageUrl: `${R2_BASE}/pinky.jpeg`,
    },
  ];

  for (const { handle, imageUrl } of mapping) {
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "handle", "title"],
      filters: {
        handle: {
          $eq: handle,
        },
      },
    });

    const product = products?.[0] as any | undefined;
    if (!product?.id) {
      logger.warn(`[update-box-images] No encontrado: handle="${handle}"`);
      continue;
    }

    const images = [{ url: imageUrl }];

    await productModuleService.updateProducts(String(product.id), {
      images,
      thumbnail: imageUrl,
    } as any);

    logger.info(
      `[update-box-images] ✅ Actualizado: "${product.title}" (${product.handle}) -> ${imageUrl}`,
    );
  }

  logger.info("[update-box-images] ✅ Listo.");
}

