import type { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { WELCOME_METADATA } from "../../shared/welcome/metadata-keys";

type CustomerLike = {
  metadata?: unknown;
};

/**
 * Tras la primera orden, marca el beneficio de bienvenida como consumido en metadata.
 * La promoción ya tiene límite de uso; esto evita intentos repetidos de aplicar en el storefront.
 */
export async function markWelcomePromoConsumedAfterOrder(params: {
  container: ExecArgs["container"];
  orderId: string;
}): Promise<void> {
  const { container, orderId } = params;
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const customerModule = container.resolve(Modules.CUSTOMER);

  let customerId: string | undefined;
  try {
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "customer_id"],
      filters: { id: orderId },
    });
    customerId = (orders?.[0] as { customer_id?: string } | undefined)
      ?.customer_id;
  } catch (e) {
    logger.warn(`[welcome] order graph ${orderId}: ${e}`);
    return;
  }

  if (!customerId) {
    return;
  }

  let customer: CustomerLike;
  try {
    customer = (await customerModule.retrieveCustomer(customerId)) as CustomerLike;
  } catch {
    return;
  }

  const meta = customer.metadata as Record<string, unknown> | null | undefined;
  if (!meta?.[WELCOME_METADATA.promoCode]) {
    return;
  }

  if (meta[WELCOME_METADATA.promoConsumed] === true) {
    return;
  }

  const merged: Record<string, unknown> = {
    ...(typeof meta === "object" && meta !== null ? meta : {}),
    [WELCOME_METADATA.promoConsumed]: true,
    welcome_promo_consumed_at: new Date().toISOString(),
  };

  try {
    await customerModule.updateCustomers(customerId, { metadata: merged });
    logger.info(
      `[welcome] promo marcado consumido para customer ${customerId}`,
    );
  } catch (e) {
    logger.warn(`[welcome] updateCustomers post-order: ${e}`);
  }
}
