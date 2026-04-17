import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { completeWelcomeProfileSchema } from "./validators";

import * as crypto from "crypto";

type CustomerLike = {
  id?: string;
  metadata?: unknown;
};

const WELCOME_METADATA = {
  offerEligible: "welcome_offer_eligible",
  profileCompletedAt: "welcome_profile_completed_at",
  promoEligibleUntil: "welcome_promo_eligible_until",
  promoCode: "welcome_promo_code",
  promoPromotionId: "welcome_promo_promotion_id",
  promoConsumed: "welcome_promo_consumed",
  instagram: "instagram_username",
  flowerPreference: "flower_preference",
  age: "age",
  gender: "gender",
} as const;

function generateWelcomePromoCode(): string {
  const bytes = crypto.randomBytes(8);
  const suffix = bytes
    .toString("base64")
    .replace(/\+/g, "")
    .replace(/\//g, "")
    .replace(/=/g, "")
    .slice(0, 12)
    .toUpperCase();
  return `WF-${suffix}`;
}

function isOfferEligible(meta: Record<string, unknown> | null | undefined): boolean {
  const v = meta?.[WELCOME_METADATA.offerEligible];
  return v === true || v === "true";
}

const WELCOME_DISCOUNT_PERCENT = 10;
const ELIGIBILITY_DAYS = 7;
const MAX_CODE_ATTEMPTS = 5;

function mergeCustomerMetadata(
  existing: unknown,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};
  return { ...base, ...patch };
}

async function createWelcomePromotion(params: {
  promotionModule: {
    createPromotions: (data: unknown) => Promise<{ id: string; code?: string }[]>;
  };
  code: string;
  endsAt: Date;
  logger: { warn: (msg: string) => void };
}): Promise<{ id: string; code: string }> {
  const { promotionModule, code, endsAt, logger } = params;

  const rawRows = await promotionModule.createPromotions([
    {
      code,
      type: "standard",
      status: "active",
      is_automatic: false,
      limit: 1,
      campaign: {
        name: "Bienvenida — primera compra",
        campaign_identifier: `welcome_${code.replace(/[^a-zA-Z0-9]/g, "")}_${Date.now()}`,
        description: "Cupón único por cliente, 7 días, un solo uso",
        starts_at: new Date(),
        ends_at: endsAt,
      },
      application_method: {
        type: "percentage",
        target_type: "items",
        value: WELCOME_DISCOUNT_PERCENT,
      },
    },
  ]);

  const rows = Array.isArray(rawRows)
    ? rawRows
    : rawRows
      ? [rawRows as { id: string; code?: string }]
      : [];

  const created = rows[0];
  if (!created?.id) {
    logger.warn(
      `[welcome/complete-profile] createPromotions sin id para code=${code}`,
    );
    throw new Error("No se pudo crear la promoción de bienvenida");
  }

  return { id: created.id, code: created.code ?? code };
}

/**
 * POST /store/welcome/complete-profile
 * Idempotente: si el perfil ya estaba completo, responde 200 sin cambios.
 */
export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const customerModule = req.scope.resolve(Modules.CUSTOMER);
  const promotionModule = req.scope.resolve(Modules.PROMOTION);

  const customerId = req.auth_context.actor_id;

  if (!customerId) {
    return res.status(401).json({ message: "No autenticado" });
  }

  const parsed = completeWelcomeProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Datos inválidos",
      issues: parsed.error.flatten().fieldErrors,
    });
  }

  const body = parsed.data;

  let customer: CustomerLike;
  try {
    customer = (await customerModule.retrieveCustomer(customerId)) as CustomerLike;
  } catch (e) {
    logger.warn(`[welcome/complete-profile] retrieveCustomer: ${e}`);
    return res.status(404).json({ message: "Cliente no encontrado" });
  }

  const meta =
    (customer?.metadata as Record<string, unknown> | null | undefined) ??
    undefined;
  if (meta?.[WELCOME_METADATA.profileCompletedAt]) {
    return res.status(200).json({
      ok: true,
      alreadyCompleted: true,
    });
  }

  if (!isOfferEligible(meta)) {
    return res.status(403).json({
      message: "Esta cuenta no tiene el beneficio de bienvenida activo.",
    });
  }

  const now = new Date();
  const eligibleUntil = new Date(now);
  eligibleUntil.setDate(eligibleUntil.getDate() + ELIGIBILITY_DAYS);

  let promoId: string | undefined;
  let promoCode: string | undefined;

  try {
    let lastErr: unknown;
    for (let i = 0; i < MAX_CODE_ATTEMPTS; i++) {
      const code = generateWelcomePromoCode();
      try {
        const created = await createWelcomePromotion({
          promotionModule,
          code,
          endsAt: eligibleUntil,
          logger,
        });
        promoId = created.id;
        promoCode = created.code;
        break;
      } catch (err) {
        lastErr = err;
        logger.warn(
          `[welcome/complete-profile] intento ${i + 1} crear promo falló: ${err}`,
        );
      }
    }
    if (promoId === undefined || promoCode === undefined) {
      throw lastErr ?? new Error("createPromotions falló");
    }
  } catch (e) {
    logger.error(`[welcome/complete-profile] Error creando promoción: ${e}`);
    return res.status(500).json({
      message: "No se pudo generar el cupón de bienvenida. Intentá más tarde.",
    });
  }

  const newMetadata = mergeCustomerMetadata(customer.metadata, {
    [WELCOME_METADATA.profileCompletedAt]: now.toISOString(),
    [WELCOME_METADATA.promoEligibleUntil]: eligibleUntil.toISOString(),
    [WELCOME_METADATA.promoCode]: promoCode,
    [WELCOME_METADATA.promoPromotionId]: promoId,
    [WELCOME_METADATA.promoConsumed]: false,
    [WELCOME_METADATA.instagram]: body.instagram,
    [WELCOME_METADATA.flowerPreference]: body.flower_preference,
    [WELCOME_METADATA.age]: String(body.age),
    [WELCOME_METADATA.gender]: body.gender,
  });

  try {
    await customerModule.updateCustomers(customerId, {
      phone: body.phone,
      metadata: newMetadata,
    });
  } catch (e) {
    logger.error(`[welcome/complete-profile] updateCustomers: ${e}`);
    return res.status(500).json({
      message: "No se pudo guardar el perfil.",
    });
  }

  return res.status(200).json({
    ok: true,
    eligibleUntil: eligibleUntil.toISOString(),
  });
}
