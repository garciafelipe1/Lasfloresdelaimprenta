import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { processReferrerRewardForMembershipOrder } from "../shared/referral/order-referral-rewards";
import { sendOrderConfirmationWorkflow } from "../workflows/send-order-confirmation";

const WELCOME_PROMO_CODE_KEY = "welcome_promo_code";
const WELCOME_PROMO_CONSUMED_KEY = "welcome_promo_consumed";

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await sendOrderConfirmationWorkflow(container).run({
    input: {
      id: data.id,
    },
  });

  // Marcar consumido (best-effort): si el cliente usó el cupón de bienvenida en su primera orden.
  try {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const customerModule = container.resolve(Modules.CUSTOMER);

    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "customer_id"],
      filters: { id: data.id },
    });

    const customerId = (orders?.[0] as { customer_id?: string } | undefined)
      ?.customer_id;
    if (!customerId) return;

    const customer = await customerModule.retrieveCustomer(customerId);
    const meta =
      customer.metadata && typeof customer.metadata === "object" && !Array.isArray(customer.metadata)
        ? (customer.metadata as Record<string, unknown>)
        : {};

    if (!meta[WELCOME_PROMO_CODE_KEY]) return;
    if (meta[WELCOME_PROMO_CONSUMED_KEY] === true) return;

    await customerModule.updateCustomers(customerId, {
      metadata: {
        ...meta,
        [WELCOME_PROMO_CONSUMED_KEY]: true,
        welcome_promo_consumed_at: new Date().toISOString(),
      },
    });

    logger.info(`[welcome] promo consumido marcado para customer ${customerId}`);
  } catch {
    // No romper confirmación de orden por esto.
  }

  try {
    await processReferrerRewardForMembershipOrder(container, data.id);
  } catch {
    // best-effort
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
