import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { CATEGORIES, LEGACY_CATEGORIES } from "@/shared/constants";

/**
 * Elimina productos duplicados de la categoría Diseños Exclusivos (o legacy "Día de la Mujer") que tienen handles antiguos.
 * Mantiene solo los productos con los handles nuevos correctos.
 *
 * Handles antiguos a eliminar:
 * - dulce-complicidad (mantener: admiracion-sutil)
 * - amor-en-equilibrio (mantener: fuerza-y-equilibrio)
 * - chispa-vital (mantener: energia-creadora)
 * - el-clasico-enamorado (mantener: reconocimiento-absoluto)
 * - declaracion-absoluta (mantener: mujer-lider)
 * - pasion-sin-filtros (mantener: determinacion-pura)
 * - ternura-infinita (mantener: elegancia-y-gracia)
 * - box-love-story (mantener: box-vanguardia-femenina)
 * - romance-perfumado (mantener: esencia-inolvidable)
 * - valentines-gold-edition (mantener: edicion-oro-8m)
 *
 * DRY_RUN=true por defecto.
 * - DRY_RUN=true  -> solo lista lo que borraría
 * - DRY_RUN=false -> borra efectivamente
 */
export default async function deleteDuplicateDiaDeLaMadre({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModuleService = container.resolve(Modules.PRODUCT);

  const dryRun = String(process.env.DRY_RUN ?? "true").toLowerCase() !== "false";

  const oldHandlesToDelete = [
    "dulce-complicidad",
    "amor-en-equilibrio",
    "chispa-vital",
    "el-clasico-enamorado",
    "declaracion-absoluta",
    "pasion-sin-filtros",
    "ternura-infinita",
    "box-love-story",
    "romance-perfumado",
    "valentines-gold-edition",
  ];

  logger.info(`Modo: ${dryRun ? "DRY_RUN (no borra)" : "BORRADO REAL"}`);
  logger.info(`Objetivo: eliminar productos con handles antiguos en "${CATEGORIES.sanValentin}" (o "${LEGACY_CATEGORIES.diaDeLaMujer}")`);

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "categories.name"],
  });

  const diaDeLaMadreProducts = (products || []).filter((p: any) =>
    (p?.categories || []).some(
      (c: any) => c?.name === CATEGORIES.sanValentin || c?.name === LEGACY_CATEGORIES.diaDeLaMujer
    )
  );

  const candidates = diaDeLaMadreProducts.filter((p: any) =>
    oldHandlesToDelete.includes(p.handle)
  );

  if (!candidates.length) {
    logger.info("No se encontraron productos duplicados con handles antiguos para eliminar.");
    return;
  }

  logger.info(`Encontrados ${candidates.length} producto(s) duplicado(s) para eliminar:`);
  candidates.forEach((p: any) =>
    logger.info(`- ${p.title} (handle: ${p.handle}, id: ${p.id})`)
  );

  if (dryRun) {
    logger.info("DRY_RUN=true → no se borró nada.");
    logger.info("Para borrar efectivamente, ejecuta: DRY_RUN=false pnpm delete:duplicate-dia-de-la-madre");
    return;
  }

  for (const p of candidates) {
    await productModuleService.deleteProducts([p.id]);
    logger.info(`✅ Borrado: ${p.title} (${p.handle})`);
  }

  logger.info(`✅ Eliminados ${candidates.length} productos duplicados.`);
}

