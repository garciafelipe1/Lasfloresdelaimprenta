import * as crypto from "crypto";
import { buildWelcomePromoTargetRulesFromEnv } from "../commerce/welcome-promo-target-rules";

const MAX_ATTEMPTS = 5;

type PromotionModuleLike = {
  createPromotions: (data: unknown) => Promise<
    { id: string; code?: string }[] | { id: string; code?: string }
  >;
  updatePromotions?: (data: unknown) => Promise<unknown>;
};

/** Desactiva una promo creada si falla el guardado de metadata (evita cupones huérfanos). */
export async function deactivatePromotionBestEffort(params: {
  promotionModule: PromotionModuleLike;
  promotionId: string;
  logger: { warn: (m: string) => void };
  logPrefix?: string;
}): Promise<void> {
  const { promotionModule, promotionId, logger, logPrefix = "[referral]" } =
    params;
  try {
    if (typeof promotionModule.updatePromotions === "function") {
      await promotionModule.updatePromotions([
        { id: promotionId, status: "inactive" },
      ]);
    }
  } catch (e) {
    logger.warn(`${logPrefix} deactivate promo ${promotionId}: ${e}`);
  }
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

function generateCode(prefix: string): string {
  const bytes = crypto.randomBytes(5);
  const suffix = bytes
    .toString("base64")
    .replace(/\+/g, "")
    .replace(/\//g, "")
    .replace(/=/g, "")
    .slice(0, 8)
    .toUpperCase();
  return `${prefix}-${suffix}`;
}

/**
 * Cupón 10% catálogo, 30 días, típicamente 1 uso (referido).
 */
export async function createReferralRefereeCatalogPromo(params: {
  promotionModule: PromotionModuleLike;
  logger: { warn: (m: string) => void };
}): Promise<{ id: string; code: string } | null> {
  const { promotionModule, logger } = params;
  const targetRules = buildWelcomePromoTargetRulesFromEnv();
  if (!targetRules?.length) {
    logger.warn(
      "[referral] Sin reglas de catálogo (env): promo referido podría afectar membresías.",
    );
  }
  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + 30);

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const code = generateCode("RR");
    try {
      const rawRows = await promotionModule.createPromotions([
        {
          code,
          type: "standard",
          status: "active",
          is_automatic: false,
          limit: 1,
          campaign: {
            name: "Referidos — referido (catálogo 10%)",
            campaign_identifier: `ref_ref_${code.replace(/[^a-zA-Z0-9]/g, "")}_${Date.now()}`,
            description: "10% catálogo, 30 días, un uso",
            starts_at: new Date(),
            ends_at: endsAt,
          },
          application_method: {
            type: "percentage",
            target_type: "items",
            allocation: "across",
            value: 10,
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
        return { id: created.id, code: created.code ?? code };
      }
    } catch (e) {
      logger.warn(`[referral] crear promo referido intento ${i + 1}: ${e}`);
    }
  }
  return null;
}

/**
 * Recompensa al referidor por compra de membresía del referido (10%, 30 días, un uso por cupón).
 */
export async function createReferrerRewardCatalogPromo(params: {
  promotionModule: PromotionModuleLike;
  logger: { warn: (m: string) => void };
}): Promise<{ id: string; code: string } | null> {
  const { promotionModule, logger } = params;
  const targetRules = buildWelcomePromoTargetRulesFromEnv();
  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + 30);

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const code = generateCode("RV");
    try {
      const rawRows = await promotionModule.createPromotions([
        {
          code,
          type: "standard",
          status: "active",
          is_automatic: false,
          limit: 1,
          campaign: {
            name: "Referidos — recompensa referidor (catálogo 10%)",
            campaign_identifier: `ref_rv_${code.replace(/[^a-zA-Z0-9]/g, "")}_${Date.now()}`,
            description: "10% catálogo, 30 días, un uso",
            starts_at: new Date(),
            ends_at: endsAt,
          },
          application_method: {
            type: "percentage",
            target_type: "items",
            allocation: "across",
            value: 10,
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
        return { id: created.id, code: created.code ?? code };
      }
    } catch (e) {
      logger.warn(`[referral] crear promo referidor intento ${i + 1}: ${e}`);
    }
  }
  return null;
}

export { mergeMetadata };
