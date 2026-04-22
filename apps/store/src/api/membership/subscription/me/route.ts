import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { MEMBERSHIP_MODULE } from "../../../../modules/membership";
import MembershipModuleService from "../../../../modules/membership/service";
import {
  clearInnerCircleCatalogPromotion,
  ensureInnerCircleCatalogPromotion,
} from "../../../../shared/membership/inner-circle-catalog-promotion";
import {
  INNER_CIRCLE_METADATA,
  earliestStartedAtFromSubscriptionList,
  resolveInnerCircleForMember,
} from "../../../../shared/membership/inner-circle";
import { differenceInCalendarDays } from "date-fns";
import { ensureOwnReferralCode } from "../../../../shared/referral/ensure-own-referral-code";
import {
  REFERRAL_OWN_CODE_KEY,
  referralGrantCountKey,
} from "../../../../shared/referral/metadata-keys";
import { listRefereesByReferrerCustomerId } from "../../../../shared/referral/list-referees-by-referrer";

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const logger = req.scope.resolve("logger");
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const memberId = req.auth_context.actor_id;
  const membershipModuleService: MembershipModuleService =
    req.scope.resolve(MEMBERSHIP_MODULE);

  const debug =
    String(process.env.SUBSCRIPTION_ME_DEBUG ?? "").trim() === "true";
  if (debug) {
    logger.info(
      `[SubscriptionMe] start memberId=${memberId} url=${req.url} method=${req.method}`,
    );
  }

  // Intentar primero con GraphQL query (usando links)
  let subscriptions: any[] = [];

  if (debug) {
    logger.info(
      `[SubscriptionMe] buscando suscripciones via GraphQL (links) para ${memberId}...`,
    );
  }
  try {
    const graphQuery = {
    entity: "customer",
    fields: [
        "subscriptions.id",
      "subscriptions.ended_at",
      "subscriptions.started_at",
      "subscriptions.membership_id",
      "subscriptions.status",
      "subscriptions.price",
        "subscriptions.external_id",
        "subscriptions.membership.id",
      "subscriptions.membership.name",
    ],
    filters: {
      id: memberId,
    },
    };
    
    const { data } = await query.graph(graphQuery);
    const customer = data[0];
    
    if (customer) {
      subscriptions = customer?.subscriptions ?? [];
      if (debug) {
        logger.info(
          `[SubscriptionMe] subscriptions via GraphQL: ${subscriptions.length}`,
        );
      }
    } else {
      if (debug) {
        logger.warn(`[SubscriptionMe] customer no encontrado id=${memberId}`);
      }
    }
  } catch (error: any) {
    logger.warn(`[SubscriptionMe] GraphQL falló (se usa fallback): ${error}`);
  }

  // Si no hay suscripciones via GraphQL, buscar directamente por customer_id
  if (subscriptions.length === 0) {
    if (debug) {
      logger.info(
        `[SubscriptionMe] sin subs via GraphQL, usando listSubscriptions({customer_id})...`,
      );
    }
    try {
      const customerSubscriptions = await membershipModuleService.listSubscriptions({
        customer_id: memberId,
      });
      
      if (customerSubscriptions.length > 0) {
        subscriptions = await Promise.all(
        customerSubscriptions.map(async (sub: any) => {
          try {
            const membership = await membershipModuleService.retrieveMembership(sub.membership_id);
            return {
              ...sub,
              membership: {
                id: membership.id,
                name: membership.name,
              },
            };
          } catch (error: any) {
            if (debug) {
              logger.warn(
                `[SubscriptionMe] no se pudo obtener membership ${sub.membership_id}: ${error}`,
              );
            }
            return {
              ...sub,
              membership: {
                id: sub.membership_id,
                name: 'Unknown',
              },
            };
          }
        })
      );
      }
    } catch (error: any) {
      logger.warn(`[SubscriptionMe] fallback listSubscriptions falló: ${error}`);
    }
  }

  if (debug) {
    logger.info(`[SubscriptionMe] subscriptions total: ${subscriptions.length}`);
  }

  // Normalizar: defensivo ante entradas undefined/null o tipos inesperados
  subscriptions = (Array.isArray(subscriptions) ? subscriptions : [])
    .filter(Boolean)
    .filter((s: any) => typeof s === "object" && !Array.isArray(s));

  // Paso 1: Verificar y actualizar suscripciones expiradas
  if (debug) {
    logger.info(`[SubscriptionMe] verificando suscripciones expiradas...`);
  }
  const now = new Date();
  const expiredSubscriptionsToUpdate: any[] = [];

  for (const sub of subscriptions) {
    if (!sub) continue;
    if (sub.status === 'active' && sub.ended_at) {
      const endedAt = new Date(sub.ended_at);
      
      // Si la fecha de finalización ya pasó, marcar como expirada
      if (endedAt < now) {
        logger.warn(`[SubscriptionMe] ⚠️ Suscripción expirada detectada: id=${sub.id}, ended_at=${sub.ended_at}`);
        expiredSubscriptionsToUpdate.push(sub);
      }
    }
  }

  // Actualizar suscripciones expiradas a "cancelled"
  if (expiredSubscriptionsToUpdate.length > 0) {
    logger.info(`[SubscriptionMe] 🔄 Actualizando ${expiredSubscriptionsToUpdate.length} suscripción(es) expirada(s)...`);
    for (const sub of expiredSubscriptionsToUpdate) {
      try {
        logger.info(`[SubscriptionMe] Actualizando suscripción ${sub.id} de "active" a "cancelled"...`);
        await membershipModuleService.updateSubscriptions({
          id: sub.id,
          status: 'cancelled',
        });
        logger.info(`[SubscriptionMe] ✅ Suscripción ${sub.id} actualizada a "cancelled"`);
        
        // Actualizar también en el array local para que el filtro funcione correctamente
        sub.status = 'cancelled';
      } catch (updateError: any) {
        logger.error(`[SubscriptionMe] ❌ Error al actualizar suscripción ${sub.id}: ${updateError.message}`);
        logger.error(`[SubscriptionMe] Stack: ${updateError.stack}`);
        // Continuar con las demás suscripciones
      }
    }
  } else {
    logger.info(`[SubscriptionMe] ✅ No se encontraron suscripciones expiradas`);
  }

  // Paso 2: Filtrar solo suscripciones realmente activas (status active Y ended_at en el futuro)
  if (debug) {
    logger.info(`[SubscriptionMe] filtrando suscripciones activas...`);
  }
  const activeSubscriptions = subscriptions
    .filter((sub: any) => {
      const isActiveStatus = sub.status === 'active';
      let isNotExpired = true;
      
      // Verificar también que la fecha de finalización no haya pasado
      if (sub.ended_at) {
        const endedAt = new Date(sub.ended_at);
        isNotExpired = endedAt >= now;
      }
      
      const isActive = isActiveStatus && isNotExpired;
      
      if (debug) {
        logger.info(
          `[SubscriptionMe] sub=${sub.id} status=${sub.status} ended_at=${sub.ended_at} isActive=${isActive}`,
        );
      }
      
      return isActive;
    })
    .sort((a: any, b: any) => {
      const dateA = new Date(a.started_at).getTime();
      const dateB = new Date(b.started_at).getTime();
      return dateB - dateA; // Más reciente primero
    });

  if (debug) {
    logger.info(
      `[SubscriptionMe] activeSubscriptions=${activeSubscriptions.length}`,
    );
  }

  /** Antigüedad (opción A): mínimo `started_at` entre todas las suscripciones; no metadata de “primer pago” aparte. */
  const historicLoyaltySince = earliestStartedAtFromSubscriptionList(subscriptions);

  let earliestMembershipDate: Date | null = null;
  if (activeSubscriptions.length > 0) {
    const earliestMs = activeSubscriptions.reduce((acc: number, sub: { started_at?: string }) => {
      const t = sub.started_at ? new Date(sub.started_at).getTime() : NaN;
      if (Number.isNaN(t)) return acc;
      return Math.min(acc, t);
    }, Number.POSITIVE_INFINITY);
    earliestMembershipDate =
      earliestMs !== Number.POSITIVE_INFINITY ? new Date(earliestMs) : null;
  }

  const loyaltyAnchor = historicLoyaltySince ?? earliestMembershipDate;

  let innerCircle: ReturnType<typeof resolveInnerCircleForMember> = null;
  if (activeSubscriptions.length > 0 && loyaltyAnchor) {
    try {
      const customerModule = req.scope.resolve(Modules.CUSTOMER);
      const customer = await customerModule.retrieveCustomer(memberId);
      const meta =
        customer?.metadata && typeof customer.metadata === "object" && !Array.isArray(customer.metadata)
          ? (customer.metadata as Record<string, unknown>)
          : undefined;
      innerCircle = resolveInnerCircleForMember({
        metadata: meta,
        earliestMembershipStartedAt: loyaltyAnchor,
      });
    } catch (e) {
      logger.warn(`[SubscriptionMe] Inner Circle omitido: ${e}`);
    }
  }

  try {
    const customerModule = req.scope.resolve(Modules.CUSTOMER);
    const promotionModule = req.scope.resolve(Modules.PROMOTION);

    if (activeSubscriptions.length > 0 && innerCircle) {
      await ensureInnerCircleCatalogPromotion({
        customerId: memberId,
        customerModule,
        promotionModule,
        innerCircle,
        logger,
      });
    }
    if (activeSubscriptions.length > 0 && loyaltyAnchor) {
      await ensureOwnReferralCode({
        customerId: memberId,
        customerModule,
        earliestMembershipStartedAt: loyaltyAnchor,
        logger,
      });
    }
    if (activeSubscriptions.length === 0) {
      const cust = await customerModule.retrieveCustomer(memberId);
      const m =
        cust?.metadata && typeof cust.metadata === "object" && !Array.isArray(cust.metadata)
          ? (cust.metadata as Record<string, unknown>)
          : {};
      if (
        m[INNER_CIRCLE_METADATA.promoPromotionId] ||
        m[INNER_CIRCLE_METADATA.promoCode]
      ) {
        await clearInnerCircleCatalogPromotion({
          customerId: memberId,
          customerModule,
          promotionModule,
          logger,
        });
      }
    }
  } catch (e) {
    logger.warn(`[SubscriptionMe] sync promo Inner Circle / referidos: ${e}`);
  }

  let referral: {
    ownCode: string | null;
    daysUntilEligible: number | null;
    referredTotal?: number;
    recentReferees?: { id: string; email: string | null; createdAt: string | null }[];
    rewardsGrantedThisMonth?: number;
    lastRewardAt?: string | null;
  } = { ownCode: null, daysUntilEligible: null };

  if (activeSubscriptions.length > 0 && loyaltyAnchor) {
    try {
      const customerModule = req.scope.resolve(Modules.CUSTOMER);
      const cust = await customerModule.retrieveCustomer(memberId);
      const m =
        cust?.metadata && typeof cust.metadata === "object" && !Array.isArray(cust.metadata)
          ? (cust.metadata as Record<string, unknown>)
          : {};
      const own =
        typeof m[REFERRAL_OWN_CODE_KEY] === "string" && m[REFERRAL_OWN_CODE_KEY].trim()
          ? (m[REFERRAL_OWN_CODE_KEY] as string).trim()
          : null;
      const daysSince = differenceInCalendarDays(new Date(), loyaltyAnchor);
      referral = {
        ownCode: own,
        daysUntilEligible: daysSince < 30 ? 30 - daysSince : null,
      };

      // Tracking referidos del usuario (si ya tiene código propio, usamos su customer_id como referrer)
      try {
        const { total, recent } = await listRefereesByReferrerCustomerId({
          customerModule,
          referrerId: memberId,
          limit: 8,
        });
        referral.referredTotal = total;
        referral.recentReferees = recent;
      } catch (e) {
        logger.warn(`[SubscriptionMe] referral tracking omitido: ${e}`);
      }

      // Recompensas otorgadas este mes (contador en metadata del referidor)
      try {
        const now = new Date();
        const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const key = referralGrantCountKey(ym);
        referral.rewardsGrantedThisMonth = Number(m[key] ?? 0) || 0;
        referral.lastRewardAt =
          typeof m["referral_referrer_last_reward_at"] === "string"
            ? (m["referral_referrer_last_reward_at"] as string)
            : null;
      } catch {
        // noop
      }
    } catch {
      // omitir
    }
  }

  return res.json({
    subscriptions: activeSubscriptions,
    innerCircle,
    referral,
  });
}
