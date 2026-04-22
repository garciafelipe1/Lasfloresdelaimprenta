import { differenceInMonths } from "date-fns";

export type InnerCircleTier = "solido" | "senior" | "vip";

export const INNER_CIRCLE_METADATA = {
  manualOverride: "inner_circle_manual_override",
  tier: "inner_circle_tier",
  notes: "inner_circle_notes",
  /** JSON string: últimas entradas de auditoría (admin). */
  adminAuditLog: "inner_circle_admin_audit",
  /** Cupón Medusa de descuento catálogo según nivel (sincronizado con el tier actual). */
  promoCode: "inner_circle_promo_code",
  promoPromotionId: "inner_circle_promo_promotion_id",
  /** Tier (`solido` | `senior` | `vip`) para el cual se emitió el cupón actual. */
  promoSnapshotTier: "inner_circle_promo_snapshot_tier",
} as const;

/**
 * Ancla de antigüedad (política “opción A”): la fecha más temprana entre todas las `started_at`
 * de suscripciones del cliente. Equivale en la práctica a “desde el primer alta de membresía” en
 * sistema; no usa fecha de pago explícita del proveedor (eso sería otra política).
 */
export function earliestStartedAtFromSubscriptionList(
  subs: readonly { started_at?: string | Date | null }[],
): Date | null {
  let min = Number.POSITIVE_INFINITY;
  for (const sub of subs) {
    if (!sub?.started_at) continue;
    const t = new Date(sub.started_at).getTime();
    if (!Number.isNaN(t)) min = Math.min(min, t);
  }
  return min === Number.POSITIVE_INFINITY ? null : new Date(min);
}

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
  /** Inicio de antigüedad considerada (ancla histórica: primera suscripción en el sitio). */
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
 * `earliestMembershipStartedAt` debe ser la fecha ancla de antigüedad (p. ej. primera `started_at`
 * histórica entre todas las suscripciones). Si es null, devuelve null.
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
