import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

/**
 * Elimina el producto de prueba "Ramo Test $1" creado por seed-ramo-1-peso.ts
 * (handle: "ramo-test-1-peso") si existe.
 */
export default async function deleteRamoTest1({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);

  const handle = "ramo-test-1-peso";

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
    logger.info(`[delete-ramo-test-1] No existe handle="${handle}". Nada para borrar.`);
    return;
  }

  await productModuleService.deleteProducts([String(p.id)]);
  logger.info(`[delete-ramo-test-1] ✅ Borrado: "${p.title}" (${p.handle}) id=${p.id}`);
}

