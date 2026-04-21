/**
 * Alcance del cupón de bienvenida (10%): solo catálogo, excluyendo membresías.
 *
 * Medusa v2 no expone `nin` en reglas; para excluir N productos de membresía
 * se usa la conjunción (AND) de reglas `product_id` + `ne` por cada ID.
 *
 * Alternativa: `WELCOME_PROMO_CATALOG_CATEGORY_IDS` (whitelist por categoría).
 *
 * Variables:
 * - WELCOME_PROMO_CATALOG_CATEGORY_IDS: ids de categoría separados por coma (prioridad sobre exclusión).
 * - WELCOME_PROMO_EXCLUDE_MEMBERSHIP_PRODUCT_IDS: ids de producto de membresía a excluir.
 */

export type WelcomePromoTargetRule = {
  attribute: string;
  operator: "ne" | "in";
  values: string[];
};

function parseCommaList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Reglas para `application_method.target_rules` del cupón de bienvenida.
 * Si no hay env configurado, devuelve `undefined` (comportamiento anterior: aplica a todos los ítems).
 */
export function buildWelcomePromoTargetRulesFromEnv(): WelcomePromoTargetRule[] | undefined {
  const catalogCategoryIds = parseCommaList(
    process.env.WELCOME_PROMO_CATALOG_CATEGORY_IDS,
  );
  if (catalogCategoryIds.length > 0) {
    return [
      {
        attribute: "product_category_id",
        operator: "in",
        values: catalogCategoryIds,
      },
    ];
  }

  const excludedProductIds = parseCommaList(
    process.env.WELCOME_PROMO_EXCLUDE_MEMBERSHIP_PRODUCT_IDS,
  );
  if (excludedProductIds.length > 0) {
    return excludedProductIds.map((id) => ({
      attribute: "product_id",
      operator: "ne",
      values: [id],
    }));
  }

  return undefined;
}
