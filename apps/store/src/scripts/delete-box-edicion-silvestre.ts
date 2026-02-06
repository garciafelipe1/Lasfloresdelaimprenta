import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

/**
 * Elimina el producto Box "EDICIÓN SILVESTRE" (handle: "edicion-silvestre")
 * del backend de Medusa si existe.
 */
export default async function deleteBoxEdicionSilvestre({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);

  const handle = "edicion-silvestre";

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
      `[delete-box-edicion-silvestre] No existe handle="${handle}". Nada para borrar.`,
    );
    return;
  }

  await productModuleService.deleteProducts([String(p.id)]);
  logger.info(
    `[delete-box-edicion-silvestre] ✅ Borrado: "${p.title}" (${p.handle}) id=${p.id}`,
  );
}

