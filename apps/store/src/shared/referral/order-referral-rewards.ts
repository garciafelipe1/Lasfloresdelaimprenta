import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import type { SubscriberArgs } from "@medusajs/framework";
import {
  REFERRAL_REFERRER_CUSTOMER_ID_KEY,
  REFERRAL_REFERRER_REWARD_ORDER_IDS_KEY,
  referralGrantCountKey,
} from "./metadata-keys";
import {
  createReferrerRewardCatalogPromo,
  deactivatePromotionBestEffort,
} from "./referral-catalog-promotion";

const REFERRER_REWARD_PROMO_CODE_KEY = "referral_referrer_reward_promo_code";
const REFERRER_REWARD_PROMO_ID_KEY = "referral_referrer_reward_promo_id";

const MAX_REWARD_ORDER_IDS = 800;

function parseRewardOrderIds(raw: unknown): string[] {
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw) as unknown;
      return Array.isArray(p) ? p.map(String) : [];
    } catch {
      return [];
    }
  }
  if (Array.isArray(raw)) {
    return raw.map(String);
  }
  return [];
}

function parseMembershipProductIds(): Set<string> {
  const raw = process.env.WELCOME_PROMO_EXCLUDE_MEMBERSHIP_PRODUCT_IDS;
  if (!raw?.trim()) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

function orderHasMembershipProduct(
  items: unknown[],
  membershipIds: Set<string>,
): boolean {
  if (membershipIds.size === 0) {
    return false;
  }
  for (const row of items) {
    const item = row as Record<string, unknown>;
    const variant = item.variant as
      | { product_id?: string; product?: { id?: string } }
      | undefined;
    const directProduct = item.product as { id?: string } | undefined;
    const pid =
      (typeof item.product_id === "string" && item.product_id) ||
      (typeof variant?.product_id === "string" && variant.product_id) ||
      (typeof directProduct?.id === "string" && directProduct.id) ||
      (typeof variant?.product?.id === "string" && variant.product.id);
    if (typeof pid === "string" && membershipIds.has(pid)) {
      return true;
    }
  }
  return false;
}

/**
 * Si el comprador fue referido y la orden incluye producto de membresía,
 * otorga al referidor hasta 3 cupones de recompensa por mes calendario.
 */
export async function processReferrerRewardForMembershipOrder(
  container: SubscriberArgs["container"],
  orderId: string,
): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const customerModule = container.resolve(Modules.CUSTOMER);
  const promotionModule = container.resolve(Modules.PROMOTION);

  const membershipIds = parseMembershipProductIds();
  if (membershipIds.size === 0) {
    return;
  }

  let orderRows: Record<string, unknown>[] = [];
  try {
    const { data } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "customer_id",
        "items.*",
        "items.product_id",
        "items.product.id",
        "items.variant.product_id",
        "items.variant.product.id",
      ],
      filters: { id: orderId },
    });
    orderRows = (data ?? []) as Record<string, unknown>[];
  } catch (e) {
    logger.warn(`[referral] order graph ${orderId}: ${e}`);
    return;
  }

  const order = orderRows[0];
  if (!order) return;

  const buyerId = order.customer_id as string | undefined;
  if (!buyerId) return;

  const items = (order.items ?? []) as unknown[];
  if (!orderHasMembershipProduct(items, membershipIds)) {
    return;
  }

  let buyer: { metadata?: unknown };
  try {
    buyer = await customerModule.retrieveCustomer(buyerId);
  } catch {
    return;
  }

  const buyerMeta =
    buyer?.metadata && typeof buyer.metadata === "object" && !Array.isArray(buyer.metadata)
      ? (buyer.metadata as Record<string, unknown>)
      : {};

  const referrerId = buyerMeta[REFERRAL_REFERRER_CUSTOMER_ID_KEY] as
    | string
    | undefined;
  if (!referrerId || referrerId === buyerId) {
    return;
  }

  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const countKey = referralGrantCountKey(ym);

  let referrer: { metadata?: unknown };
  try {
    referrer = await customerModule.retrieveCustomer(referrerId);
  } catch {
    return;
  }

  const refMeta =
    referrer?.metadata && typeof referrer.metadata === "object" && !Array.isArray(referrer.metadata)
      ? (referrer.metadata as Record<string, unknown>)
      : {};

  const rewardOrderIds = parseRewardOrderIds(
    refMeta[REFERRAL_REFERRER_REWARD_ORDER_IDS_KEY],
  );
  if (rewardOrderIds.includes(orderId)) {
    return;
  }

  const used = Number(refMeta[countKey] ?? 0);
  if (!Number.isFinite(used) || used >= 3) {
    logger.info(`[referral] referidor ${referrerId} alcanzó tope mensual de recompensas`);
    return;
  }

  const created = await createReferrerRewardCatalogPromo({
    promotionModule,
    logger,
  });

  if (!created) {
    logger.warn(`[referral] no se creó recompensa para referidor ${referrerId}`);
    return;
  }

  const nextRewardIds = [...rewardOrderIds, orderId];
  const cappedRewardIds =
    nextRewardIds.length > MAX_REWARD_ORDER_IDS
      ? nextRewardIds.slice(-MAX_REWARD_ORDER_IDS)
      : nextRewardIds;

  try {
    await customerModule.updateCustomers(referrerId, {
      metadata: {
        ...refMeta,
        [countKey]: used + 1,
        [REFERRER_REWARD_PROMO_CODE_KEY]: created.code,
        [REFERRER_REWARD_PROMO_ID_KEY]: created.id,
        [REFERRAL_REFERRER_REWARD_ORDER_IDS_KEY]: JSON.stringify(cappedRewardIds),
        referral_referrer_last_reward_at: new Date().toISOString(),
      },
    });
    logger.info(
      `[referral] recompensa referidor ${referrerId} cupón ${created.code} (${used + 1}/3 ${ym})`,
    );
  } catch (e) {
    logger.warn(`[referral] update referidor post-recompensa: ${e}`);
    await deactivatePromotionBestEffort({
      promotionModule,
      promotionId: created.id,
      logger,
      logPrefix: "[referral]",
    });
  }
}
