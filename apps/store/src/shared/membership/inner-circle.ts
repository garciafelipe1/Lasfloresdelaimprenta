import { differenceInMonths } from "date-fns";

export type InnerCircleTier = "solido" | "senior" | "vip";

export const INNER_CIRCLE_METADATA = {
  manualOverride: "inner_circle_manual_override",
  tier: "inner_circle_tier",
  notes: "inner_circle_notes",
  /** Cupón Medusa de descuento catálogo según nivel (sincronizado con el tier actual). */
  promoCode: "inner_circle_promo_code",
  promoPromotionId: "inner_circle_promo_promotion_id",
  /** Tier (`solido` | `senior` | `vip`) para el cual se emitió el cupón actual. */
  promoSnapshotTier: "inner_circle_promo_snapshot_tier",
} as const;

const TIER_LABEL_ES: Record<InnerCircleTier, string> = {
  solido: "Lead Sólido",
  senior: "Lead Senior",
  vip: "Lead VIP",
};

const TIER_CATALOG_PERCENT: Record<InnerCircleTier, number> = {
  solido: 5,
  senior: 7,
  vip: 10,
};

export type InnerCirclePublicPayload = {
  tier: InnerCircleTier;
  labelEs: string;
  /** Descuento acordado solo para catálogo (la promo en Medusa se implementa aparte). */
  catalogDiscountPercent: number;
  /** Inicio de antigüedad considerada (primera suscripción activa en el sitio). */
  memberSince: string;
  source: "auto" | "manual";
};

function parseTier(raw: unknown): InnerCircleTier | null {
  if (raw === "solido" || raw === "senior" || raw === "vip") {
    return raw;
  }
  return null;
}

function isManualOverride(meta: Record<string, unknown>): boolean {
  const v = meta[INNER_CIRCLE_METADATA.manualOverride];
  return v === true || v === "true";
}

/**
 * Antigüedad: meses 1–6 → Sólido; 6–12 → Senior; 12+ → VIP (límites por meses completos desde `startedAt`).
 */
export function computeInnerCircleTierAuto(
  startedAt: Date,
  now: Date = new Date(),
): InnerCircleTier {
  const months = differenceInMonths(now, startedAt);
  if (months < 6) return "solido";
  if (months < 12) return "senior";
  return "vip";
}

/**
 * Resuelve el nivel Inner Circle para el perfil del miembro.
 * Si no hay fecha de inicio, devuelve null (no mostrar bloque).
 */
export function resolveInnerCircleForMember(params: {
  metadata: Record<string, unknown> | null | undefined;
  earliestMembershipStartedAt: Date | null;
}): InnerCirclePublicPayload | null {
  const meta =
    params.metadata && typeof params.metadata === "object" && !Array.isArray(params.metadata)
      ? (params.metadata as Record<string, unknown>)
      : {};

  if (!params.earliestMembershipStartedAt) {
    return null;
  }

  const since = params.earliestMembershipStartedAt.toISOString();

  if (isManualOverride(meta)) {
    const forced = parseTier(meta[INNER_CIRCLE_METADATA.tier]);
    if (forced) {
      return {
        tier: forced,
        labelEs: TIER_LABEL_ES[forced],
        catalogDiscountPercent: TIER_CATALOG_PERCENT[forced],
        memberSince: since,
        source: "manual",
      };
    }
  }

  const auto = computeInnerCircleTierAuto(params.earliestMembershipStartedAt);
  return {
    tier: auto,
    labelEs: TIER_LABEL_ES[auto],
    catalogDiscountPercent: TIER_CATALOG_PERCENT[auto],
    memberSince: since,
    source: "auto",
  };
}
