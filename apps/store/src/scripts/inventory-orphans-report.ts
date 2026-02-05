import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import fs from "fs";
import path from "path";

type OrphanCandidate = {
  id: string;
  sku?: string | null;
  reason: string;
};

/**
 * Reporte (dry-run) de inventory_items huérfanos.
 *
 * Reglas de seguridad:
 * - NO borra nada.
 * - Solo marca como "eliminable" a inventory_items que:
 *   1) NO están referenciados por ninguna variant/product en Medusa
 *   2) Su SKU NO coincide con ningún SKU de variante existente (backend)
 *   3) Su SKU NO coincide con ningún SKU "visible en catálogo" (aprox: productos publicados)
 *
 * Salida:
 * - Imprime resumen
 * - Escribe un JSON con los IDs sugeridos para borrar
 */
export default async function inventoryOrphansReport({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const graphAll = async <T = any>(opts: {
    entity: string;
    fields: string[];
    filters?: any;
  }): Promise<T[]> => {
    const take = 500;
    let skip = 0;
    const all: T[] = [];

    // Intentar paginar si el engine lo soporta. Si no, caer a 1 request.
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

        // guardrail para evitar loops infinitos
        if (skip > 100_000) break;
      }

      return all;
    } catch (e: any) {
      logger.warn(
        `[inv-orphans:report] Pagination no soportada en query.graph (fallback single fetch). Error: ${e?.message || e}`,
      );
      const res = await query.graph({
        entity: opts.entity,
        fields: opts.fields,
        filters: opts.filters,
      } as any);
      return (res?.data || []) as T[];
    }
  };

  logger.info("[inv-orphans:report] Recolectando inventory_items (all)...");
  const inventoryItems = await graphAll({
    entity: "inventory_item",
    fields: ["id", "sku"],
  });

  logger.info("[inv-orphans:report] Recolectando variantes (SKU + inventory_items)...");
  const variants = await graphAll({
    entity: "product_variant",
    fields: [
      "id",
      "sku",
      "product.id",
      "product.title",
      "product.handle",
      "product.status",
      // Relación clave para detectar huérfanos
      "inventory_items.id",
      "inventory_items.sku",
    ],
  });

  // Backend set: todos los SKUs de variantes existentes
  const backendVariantSkus = new Set<string>();
  // Backend set: inventory_item ids referenciados por alguna variant
  const referencedInventoryItemIds = new Set<string>();
  // Frontend-visible set (aprox): SKUs de variantes cuyo product está publicado
  const visibleVariantSkus = new Set<string>();

  for (const v of (variants || []) as any[]) {
    if (typeof v?.sku === "string" && v.sku.trim()) {
      const sku = v.sku.trim();
      backendVariantSkus.add(sku);

      const status = (v?.product?.status || "").toString().toLowerCase();
      if (status === "published") {
        visibleVariantSkus.add(sku);
      }
    }

    const invs = (v?.inventory_items || []) as any[];
    for (const inv of invs) {
      if (inv?.id) referencedInventoryItemIds.add(String(inv.id));
    }
  }

  const allInv = (inventoryItems || []) as any[];
  const totalInventoryItems = allInv.length;
  const totalReferenced = referencedInventoryItemIds.size;

  const deletable: OrphanCandidate[] = [];
  const kept: { id: string; sku?: string | null; reason: string }[] = [];

  for (const item of allInv) {
    const id = String(item.id);
    const sku = typeof item.sku === "string" ? item.sku.trim() : null;

    // 1) Si está referenciado por una variant, se conserva sí o sí
    if (referencedInventoryItemIds.has(id)) {
      kept.push({ id, sku, reason: "referenciado_por_variant" });
      continue;
    }

    // 2) Si su SKU coincide con SKU de alguna variant existente, se conserva (protección extra)
    if (sku && backendVariantSkus.has(sku)) {
      kept.push({ id, sku, reason: "sku_coincide_con_variant_backend" });
      continue;
    }

    // 3) Si su SKU coincide con algo publicado (aprox catálogo), se conserva (protección extra)
    if (sku && visibleVariantSkus.has(sku)) {
      kept.push({ id, sku, reason: "sku_visible_en_catalogo_publicado" });
      continue;
    }

    // 4) Candidato a borrar: no está referenciado ni protegido por SKU
    deletable.push({
      id,
      sku,
      reason:
        "huérfano (no referenciado por variants/products y no coincide con SKUs backend/visibles)",
    });
  }

  // Orden estable (por sku y luego id)
  deletable.sort((a, b) => {
    const as = (a.sku || "").localeCompare(b.sku || "");
    return as !== 0 ? as : a.id.localeCompare(b.id);
  });

  logger.info("[inv-orphans:report] ================= RESUMEN =================");
  logger.info(
    `[inv-orphans:report] inventory_items totales: ${totalInventoryItems}`,
  );
  logger.info(
    `[inv-orphans:report] inventory_items referenciados por variants: ${totalReferenced}`,
  );
  logger.info(
    `[inv-orphans:report] inventory_items candidatos a eliminar (huérfanos): ${deletable.length}`,
  );

  // Mostrar una vista previa (máximo 50) para validación humana
  const preview = deletable.slice(0, 50);
  if (preview.length) {
    logger.info("[inv-orphans:report] Preview de ELIMINABLES (máx 50):");
    preview.forEach((x) =>
      logger.info(`- ${x.sku || "(sin-sku)"}  | ${x.id}`),
    );
  } else {
    logger.info("[inv-orphans:report] No hay huérfanos para eliminar.");
  }

  const outDir = path.join(process.cwd(), ".medusa", "reports");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "inventory-orphans.json");

  const payload = {
    generated_at: new Date().toISOString(),
    totals: {
      inventory_items: totalInventoryItems,
      referenced_by_variants: totalReferenced,
      deletable_orphans: deletable.length,
      kept: kept.length,
    },
    deletable,
    kept_sample: kept.slice(0, 50),
  };

  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2), "utf8");
  logger.info(
    `[inv-orphans:report] Reporte escrito en: ${outFile}`,
  );
  logger.info(
    "[inv-orphans:report] ✅ No se borró nada. Si querés borrar, ejecutá el script de delete con confirmación explícita.",
  );
}

