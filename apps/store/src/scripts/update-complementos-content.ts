import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { CATEGORIES } from "@/shared/constants";
import { complementos } from "./seed/products/complementos.seed";
import slugify from "slugify";

function normalizeTitle(input: string) {
  return input
    .normalize("NFD")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

const toHandle = (value: string) =>
  slugify(value, { lower: true, trim: true, strict: true });

/**
 * Actualiza contenido de la categoría "Complementos" en la DB:
 * - description (vacía)
 * - images + thumbnail
 * - metadata (merge)
 *
 * NO borra nada.
 */
export default async function updateComplementosContent({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);

  const IMAGE_BY_HANDLE: Record<string, string> = {
    petit: "/assets/img/productos/complementos/petit.jpeg",
    rock: "/assets/img/productos/complementos/rock.jpeg",
    glow: "/assets/img/productos/complementos/glow.jpeg",
    "iris-xl": "/assets/img/productos/complementos/Iris.jpeg",
    iris: "/assets/img/productos/complementos/Iris.jpeg",
    anello: "/assets/img/productos/complementos/anello.jpeg",
    cristalito: "/assets/img/productos/complementos/cristalito.jpeg",
    wild: "/assets/img/productos/complementos/wild.jpeg",
    "silver-jar": "/assets/img/productos/complementos/silverjar.jpeg",
    natale: "/assets/img/productos/complementos/natale.jpeg",
    "velon-raggio": "/assets/img/productos/complementos/velonraggio.jpeg",
    "velon-chiara": "/assets/img/productos/complementos/velonchiara.jpeg",
  };

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "categories.name", "metadata"],
  });

  const targetProducts = (products || []).filter((p: any) =>
    (p?.categories || []).some((c: any) => c?.name === CATEGORIES.complementos)
  );

  const byHandle = new Map<string, any>();
  const byNormTitle = new Map<string, any>();
  for (const p of targetProducts) {
    byHandle.set(String(p.handle), p);
    byNormTitle.set(normalizeTitle(String(p.title)), p);
  }

  let updated = 0;
  let missing = 0;

  for (const desired of complementos as any[]) {
    const desiredHandle = toHandle(desired.title);
    const found =
      byHandle.get(desiredHandle) ??
      byNormTitle.get(normalizeTitle(desired.title));

    if (!found) {
      missing += 1;
      logger.warn(
        `No encontrado en DB para actualizar (se creará solo con seed:products): "${desired.title}"`
      );
      continue;
    }

    const handle = String(found.handle);
    const mappedImage = IMAGE_BY_HANDLE[handle];
    const images = mappedImage
      ? [{ url: mappedImage }]
      : (desired.images || []).map((url: string) => ({ url }));
    const thumbnail = images?.[0]?.url ?? null;
    const nextMetadata = {
      ...(found.metadata || {}),
      ...(desired.metadata || {}),
    };

    await productModuleService.updateProducts(found.id, {
      description: desired.description ?? "",
      images,
      thumbnail,
      metadata: nextMetadata,
    });

    updated += 1;
    logger.info(`✅ Actualizado: ${desired.title} (${found.handle})`);
  }

  logger.info(`Resumen: actualizados=${updated}, sin match=${missing}.`);
}

