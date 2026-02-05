import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import fs from "fs";
import path from "path";

type OrphanCandidate = {
  id: string;
  sku?: string | null;
  reason?: string;
};

/**
 * Borra inventory_items huérfanos previamente aprobados.
 *
 * Seguridad:
 * - Requiere CONFIRM_DELETE=YES
 * - Lee el archivo generado por inventory-orphans-report (por defecto .medusa/reports/inventory-orphans.json)
 */
export default async function inventoryOrphansDelete({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  const confirm = (process.env.CONFIRM_DELETE || "").toUpperCase();
  if (confirm !== "YES") {
    logger.error(
      "[inv-orphans:delete] ABORTADO. Seteá CONFIRM_DELETE=YES para ejecutar el borrado.",
    );
    return;
  }

  const reportPath =
    process.env.ORPHANS_REPORT ||
    path.join(process.cwd(), ".medusa", "reports", "inventory-orphans.json");

  if (!fs.existsSync(reportPath)) {
    throw new Error(
      `[inv-orphans:delete] No existe el reporte en ${reportPath}. Ejecutá primero inventory-orphans-report.`,
    );
  }

  const report = JSON.parse(fs.readFileSync(reportPath, "utf8")) as {
    deletable: OrphanCandidate[];
  };

  const deletable = (report.deletable || []).filter((x) => x?.id);
  if (!deletable.length) {
    logger.info("[inv-orphans:delete] No hay huérfanos para borrar.");
    return;
  }

  const ids = deletable.map((x) => String(x.id));

  logger.warn("[inv-orphans:delete] ================= PRE-BORRADO =================");
  logger.warn(`[inv-orphans:delete] IDs a borrar: ${ids.length}`);
  logger.warn(
    `[inv-orphans:delete] Ejemplo (máx 20): ${deletable
      .slice(0, 20)
      .map((x) => x.sku || "(sin-sku)")
      .join(", ")}`,
  );

  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  // Revalidación de seguridad en runtime: si ahora el item quedó referenciado, NO lo borramos.
  logger.info("[inv-orphans:delete] Revalidando referencias con product_variant.inventory_items...");
  const graphAll = async <T = any>(opts: {
    entity: string;
    fields: string[];
    filters?: any;
  }): Promise<T[]> => {
    const take = 500;
    let skip = 0;
    const all: T[] = [];
    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const res = await query.graph({
          entity: opts.entity,
          fields: opts.fields,
          filters: opts.filters,
          pagination: { take, skip },
        } as any);
        const chunk = (res?.data || []) as T[];
        all.push(...chunk);
        if (chunk.length < take) break;
        skip += take;
        if (skip > 100_000) break;
      }
      return all;
    } catch {
      const res = await query.graph({
        entity: opts.entity,
        fields: opts.fields,
        filters: opts.filters,
      } as any);
      return (res?.data || []) as T[];
    }
  };

  const variants = await graphAll({
    entity: "product_variant",
    fields: ["id", "inventory_items.id"],
  });

  const referenced = new Set<string>();
  for (const v of (variants || []) as any[]) {
    for (const inv of (v?.inventory_items || []) as any[]) {
      if (inv?.id) referenced.add(String(inv.id));
    }
  }

  const safeIds = ids.filter((id) => !referenced.has(id));
  const skipped = ids.filter((id) => referenced.has(id));

  if (skipped.length) {
    logger.warn(
      `[inv-orphans:delete] ⚠️ Se omitieron ${skipped.length} inventory_items porque quedaron referenciados (no se borran).`,
    );
  }

  if (!safeIds.length) {
    logger.info(
      "[inv-orphans:delete] No quedó ningún ID seguro para borrar después de revalidar. Fin.",
    );
    return;
  }

  const inventoryModuleService: any = container.resolve(Modules.INVENTORY);

  logger.info("[inv-orphans:delete] Ejecutando borrado...");

  // Compatibilidad: Medusa puede exponer métodos distintos según versión
  if (typeof inventoryModuleService.deleteInventoryItems === "function") {
    await inventoryModuleService.deleteInventoryItems(safeIds);
  } else if (typeof inventoryModuleService.deleteInventoryItem === "function") {
    for (const id of safeIds) {
      await inventoryModuleService.deleteInventoryItem(id);
    }
  } else if (typeof inventoryModuleService.delete === "function") {
    await inventoryModuleService.delete(safeIds);
  } else if (typeof inventoryModuleService.softDeleteInventoryItems === "function") {
    await inventoryModuleService.softDeleteInventoryItems(safeIds);
  } else {
    const keys = Object.keys(inventoryModuleService || {});
    throw new Error(
      `[inv-orphans:delete] No encontré un método de delete en Inventory service. Keys: ${keys.join(
        ", ",
      )}`,
    );
  }

  logger.info(
    `[inv-orphans:delete] ✅ Borrado completado. inventory_items borrados: ${safeIds.length}`,
  );

  // Guardar log del borrado
  const outDir = path.join(process.cwd(), ".medusa", "reports");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "inventory-orphans.deleted.json");
  fs.writeFileSync(
    outFile,
    JSON.stringify(
      {
        deleted_at: new Date().toISOString(),
        report_used: reportPath,
        deleted_ids: safeIds,
        skipped_referenced_ids: skipped,
      },
      null,
      2,
    ),
    "utf8",
  );
  logger.info(`[inv-orphans:delete] Log escrito en: ${outFile}`);
}

