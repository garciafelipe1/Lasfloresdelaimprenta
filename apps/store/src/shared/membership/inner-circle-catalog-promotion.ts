import * as crypto from "crypto";
import { buildWelcomePromoTargetRulesFromEnv } from "../commerce/welcome-promo-target-rules";
import { INNER_CIRCLE_METADATA, type InnerCirclePublicPayload } from "./inner-circle";

const MAX_CODE_ATTEMPTS = 5;

type CustomerModuleLike = {
  retrieveCustomer: (id: string) => Promise<{ metadata?: unknown }>;
  updateCustomers: (
    id: string,
    data: { metadata?: Record<string, unknown> },
  ) => Promise<unknown>;
};

type PromotionModuleLike = {
  createPromotions: (data: unknown) => Promise<
    { id: string; code?: string }[] | { id: string; code?: string }
  >;
  updatePromotions?: (data: unknown) => Promise<unknown>;
};

function generateInnerCirclePromoCode(): string {
  const bytes = crypto.randomBytes(6);
  const suffix = bytes
    .toString("base64")
    .replace(/\+/g, "")
    .replace(/\//g, "")
    .replace(/=/g, "")
    .slice(0, 10)
    .toUpperCase();
  return `IC-${suffix}`;
}

function mergeMetadata(
  existing: unknown,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};
  return { ...base, ...patch };
}

async function deactivatePromotionBestEffort(
  promotionModule: PromotionModuleLike,
  promotionId: string,
  logger: { warn: (m: string) => void },
): Promise<void> {
  try {
    if (typeof promotionModule.updatePromotions === "function") {
      await promotionModule.updatePromotions([
        { id: promotionId, status: "inactive" },
      ]);
    }
  } catch (e) {
    logger.warn(`[inner-circle] No se pudo desactivar promoción ${promotionId}: ${e}`);
  }
}

/**
 * Crea o actualiza el cupón de catálogo del Inner Circle cuando cambia el nivel.
 * Mismas reglas de exclusión de membresía que el cupón de bienvenida (env compartidos).
 */
export async function ensureInnerCircleCatalogPromotion(params: {
  customerId: string;
  customerModule: CustomerModuleLike;
  promotionModule: PromotionModuleLike;
  innerCircle: InnerCirclePublicPayload;
  logger: { warn: (m: string) => void; info?: (m: string) => void };
}): Promise<void> {
  const { customerId, customerModule, promotionModule, innerCircle, logger } =
    params;

  const customer = await customerModule.retrieveCustomer(customerId);
  const meta =
    customer?.metadata && typeof customer.metadata === "object" && !Array.isArray(customer.metadata)
      ? (customer.metadata as Record<string, unknown>)
      : {};

  const snapshot = meta[INNER_CIRCLE_METADATA.promoSnapshotTier];
  const existingId = meta[INNER_CIRCLE_METADATA.promoPromotionId];

  if (
    snapshot === innerCircle.tier &&
    typeof meta[INNER_CIRCLE_METADATA.promoCode] === "string" &&
    (meta[INNER_CIRCLE_METADATA.promoCode] as string).trim().length > 0
  ) {
    return;
  }

  if (typeof existingId === "string" && existingId.trim()) {
    await deactivatePromotionBestEffort(promotionModule, existingId.trim(), logger);
  }

  const targetRules = buildWelcomePromoTargetRulesFromEnv();
  if (!targetRules?.length) {
    logger.warn(
      "[inner-circle] Sin reglas de catálogo (mismas env que bienvenida): el descuento IC podría aplicar a membresías.",
    );
  }

  const endsAt = new Date();
  endsAt.setFullYear(endsAt.getFullYear() + 10);

  let promoId: string | undefined;
  let promoCode: string | undefined;

  for (let i = 0; i < MAX_CODE_ATTEMPTS; i++) {
    const code = generateInnerCirclePromoCode();
    try {
      const rawRows = await promotionModule.createPromotions([
        {
          code,
          type: "standard",
          status: "active",
          is_automatic: false,
          limit: null,
          campaign: {
            name: `Inner Circle — ${innerCircle.labelEs}`,
            campaign_identifier: `ic_${innerCircle.tier}_${code.replace(/[^a-zA-Z0-9]/g, "")}_${Date.now()}`,
            description: `Descuento catálogo miembro (${innerCircle.catalogDiscountPercent}%), excluye membresías si está configurado`,
            starts_at: new Date(),
            ends_at: endsAt,
          },
          application_method: {
            type: "percentage",
            target_type: "items",
            allocation: "across",
            value: innerCircle.catalogDiscountPercent,
            ...(targetRules?.length ? { target_rules: targetRules } : {}),
          },
        },
      ]);

      const rows = Array.isArray(rawRows)
        ? rawRows
        : rawRows
          ? [rawRows as { id: string; code?: string }]
          : [];
      const created = rows[0];
      if (created?.id) {
        promoId = created.id;
        promoCode = created.code ?? code;
        break;
      }
    } catch (err) {
      logger.warn(`[inner-circle] intento ${i + 1} crear promo falló: ${err}`);
    }
  }

  if (!promoId || !promoCode) {
    logger.warn("[inner-circle] No se pudo crear la promoción de Inner Circle");
    return;
  }

  await customerModule.updateCustomers(customerId, {
    metadata: mergeMetadata(customer.metadata, {
      [INNER_CIRCLE_METADATA.promoCode]: promoCode,
      [INNER_CIRCLE_METADATA.promoPromotionId]: promoId,
      [INNER_CIRCLE_METADATA.promoSnapshotTier]: innerCircle.tier,
    }),
  });

  logger.info?.(`[inner-circle] Cupón ${promoCode} (${innerCircle.tier}) para customer ${customerId}`);
}

/**
 * Sin membresía activa: desactiva la promo guardada y limpia metadata.
 */
export async function clearInnerCircleCatalogPromotion(params: {
  customerId: string;
  customerModule: CustomerModuleLike;
  promotionModule: PromotionModuleLike;
  logger: { warn: (m: string) => void };
}): Promise<void> {
  const { customerId, customerModule, promotionModule, logger } = params;

  const customer = await customerModule.retrieveCustomer(customerId);
  const meta =
    customer?.metadata && typeof customer.metadata === "object" && !Array.isArray(customer.metadata)
      ? (customer.metadata as Record<string, unknown>)
      : {};

  const existingId = meta[INNER_CIRCLE_METADATA.promoPromotionId];
  if (typeof existingId === "string" && existingId.trim()) {
    await deactivatePromotionBestEffort(promotionModule, existingId.trim(), logger);
  }

  const next = { ...meta };
  delete next[INNER_CIRCLE_METADATA.promoCode];
  delete next[INNER_CIRCLE_METADATA.promoPromotionId];
  delete next[INNER_CIRCLE_METADATA.promoSnapshotTier];

  await customerModule.updateCustomers(customerId, {
    metadata: next,
  });
}
