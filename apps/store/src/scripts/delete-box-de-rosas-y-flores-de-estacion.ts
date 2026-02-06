import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

/**
 * Elimina el producto legacy:
 * - "Box de rosas y flores de estación"
 * - handle: "box-de-rosas-y-flores-de-estacion"
 */
export default async function deleteLegacyBoxRosasEstacion({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);

  const handle = "box-de-rosas-y-flores-de-estacion";

  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "title"],
    filters: {
      handle: {
        $eq: handle,
      },
    },
  });

  const p = existing?.[0] as any | undefined;
  if (!p?.id) {
    logger.info(
      `[delete-legacy-box] No existe handle="${handle}". Nada para borrar.`,
    );
    return;
  }

  await productModuleService.deleteProducts([String(p.id)]);
  logger.info(
    `[delete-legacy-box] ✅ Borrado: "${p.title}" (${p.handle}) id=${p.id}`,
  );
}

