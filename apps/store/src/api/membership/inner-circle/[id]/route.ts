import type {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { MEMBERSHIP_MODULE } from "../../../../modules/membership";
import MembershipModuleService from "../../../../modules/membership/service";
import {
  INNER_CIRCLE_METADATA,
  earliestStartedAtFromSubscriptionList,
  resolveInnerCircleForMember,
} from "../../../../shared/membership/inner-circle";
import {
  appendInnerCircleAdminAudit,
  parseInnerCircleAdminAudit,
} from "../../../../shared/membership/inner-circle-admin-audit";
import {
  clearInnerCircleCatalogPromotion,
  ensureInnerCircleCatalogPromotion,
} from "../../../../shared/membership/inner-circle-catalog-promotion";
import { innerCircleAdminPutSchema } from "../validators";

function isSubscriptionActive(sub: {
  status?: string;
  ended_at?: string | Date | null;
}): boolean {
  const now = new Date();
  if (sub.status !== "active") return false;
  if (!sub.ended_at) return true;
  const ended = new Date(sub.ended_at);
  return !Number.isNaN(ended.getTime()) && ended >= now;
}

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

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = req.params.id as string;
  if (!customerId) {
    return res.status(400).json({ message: "Falta customer id" });
  }

  const customerModule = req.scope.resolve(Modules.CUSTOMER);
  const membershipModuleService: MembershipModuleService =
    req.scope.resolve(MEMBERSHIP_MODULE);

  let customer: Awaited<ReturnType<typeof customerModule.retrieveCustomer>>;
  try {
    customer = await customerModule.retrieveCustomer(customerId);
  } catch {
    return res.status(404).json({ message: "Cliente no encontrado" });
  }

  const mine = await membershipModuleService.listSubscriptions({
    customer_id: customerId,
  });
  const historic = earliestStartedAtFromSubscriptionList(mine);
  const activeSubs = mine.filter(isSubscriptionActive);
  const hasActiveSubscription = activeSubs.length > 0;

  const meta =
    customer.metadata && typeof customer.metadata === "object" && !Array.isArray(customer.metadata)
      ? (customer.metadata as Record<string, unknown>)
      : {};

  const resolved = historic
    ? resolveInnerCircleForMember({
        metadata: meta,
        earliestMembershipStartedAt: historic,
      })
    : null;

  return res.json({
    customerId,
    email: customer.email ?? null,
    name: `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() || null,
    hasActiveSubscription,
    benefitsActive: hasActiveSubscription,
    historicLoyaltySince: historic?.toISOString() ?? null,
    manualOverride: meta[INNER_CIRCLE_METADATA.manualOverride] === true ||
      meta[INNER_CIRCLE_METADATA.manualOverride] === "true",
    notes:
      typeof meta[INNER_CIRCLE_METADATA.notes] === "string"
        ? (meta[INNER_CIRCLE_METADATA.notes] as string)
        : null,
    innerCircle: resolved,
    promoCode:
      typeof meta[INNER_CIRCLE_METADATA.promoCode] === "string"
        ? (meta[INNER_CIRCLE_METADATA.promoCode] as string)
        : null,
    audit: parseInnerCircleAdminAudit(meta),
  });
}

export async function PUT(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const customerId = req.params.id as string;
  if (!customerId) {
    return res.status(400).json({ message: "Falta customer id" });
  }

  const parsed = innerCircleAdminPutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Body inválido",
      issues: parsed.error.flatten().fieldErrors,
    });
  }

  const customerModule = req.scope.resolve(Modules.CUSTOMER);
  const promotionModule = req.scope.resolve(Modules.PROMOTION);
  const membershipModuleService: MembershipModuleService =
    req.scope.resolve(MEMBERSHIP_MODULE);

  const actorId = req.auth_context?.actor_id;

  let customer: { metadata?: unknown };
  try {
    customer = await customerModule.retrieveCustomer(customerId);
  } catch {
    return res.status(404).json({ message: "Cliente no encontrado" });
  }

  const meta =
    customer.metadata && typeof customer.metadata === "object" && !Array.isArray(customer.metadata)
      ? ({ ...(customer.metadata as Record<string, unknown>) } as Record<string, unknown>)
      : {};

  const body = parsed.data;
  const nowIso = new Date().toISOString();

  let nextMeta = meta;
  if (body.mode === "auto") {
    const cleared = { ...nextMeta };
    delete cleared[INNER_CIRCLE_METADATA.tier];
    nextMeta = mergeCustomerMetadata(cleared, {
      [INNER_CIRCLE_METADATA.manualOverride]: false,
    });
    nextMeta = appendInnerCircleAdminAudit(nextMeta, {
      at: nowIso,
      actorId,
      action: "inner_circle_set_auto",
    });
  } else {
    nextMeta = mergeCustomerMetadata(nextMeta, {
      [INNER_CIRCLE_METADATA.manualOverride]: true,
      [INNER_CIRCLE_METADATA.tier]: body.tier,
      [INNER_CIRCLE_METADATA.notes]: body.notes ?? "",
    });
    nextMeta = appendInnerCircleAdminAudit(nextMeta, {
      at: nowIso,
      actorId,
      action: "inner_circle_set_manual",
      detail: body.tier,
    });
  }

  try {
    await customerModule.updateCustomers(customerId, {
      metadata: nextMeta,
    });
  } catch (e) {
    logger.warn(`[inner-circle-admin] updateCustomers: ${e}`);
    return res.status(500).json({ message: "No se pudo guardar metadata" });
  }

  const refreshed = await customerModule.retrieveCustomer(customerId);
  const metaAfter =
    refreshed.metadata && typeof refreshed.metadata === "object" && !Array.isArray(refreshed.metadata)
      ? (refreshed.metadata as Record<string, unknown>)
      : {};

  const mine = await membershipModuleService.listSubscriptions({
    customer_id: customerId,
  });
  const historic = earliestStartedAtFromSubscriptionList(mine);
  const activeSubs = mine.filter(isSubscriptionActive);
  const hasActive = activeSubs.length > 0;

  const innerCircleResolved =
    historic != null
      ? resolveInnerCircleForMember({
          metadata: metaAfter,
          earliestMembershipStartedAt: historic,
        })
      : null;

  try {
    if (hasActive && innerCircleResolved) {
      await ensureInnerCircleCatalogPromotion({
        customerId,
        customerModule,
        promotionModule,
        innerCircle: innerCircleResolved,
        logger,
      });
    } else {
      await clearInnerCircleCatalogPromotion({
        customerId,
        customerModule,
        promotionModule,
        logger,
      });
    }
  } catch (e) {
    logger.warn(`[inner-circle-admin] sync promo: ${e}`);
  }

  return res.json({ ok: true });
}
