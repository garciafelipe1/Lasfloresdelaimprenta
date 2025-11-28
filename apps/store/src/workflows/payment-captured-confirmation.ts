// import { templatesNames } from "@/modules/resend/service";
import { MedusaError } from "@medusajs/framework/utils";
import { createWorkflow } from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { logStep } from "./steps/log";
// import { sendNotificationStep } from "./steps/send-notification";

type WorkflowInput = { payment_id: string };

export const sendOrderConfirmationOnPaymentCapturedWorkflow = createWorkflow(
  "send-order-confirmation-on-payment-captured",
  ({ payment_id }: WorkflowInput) => {
    // 1. Get the payment and its associated order
    // @ts-ignore
    const { data: payments } = useQueryGraphStep({
      entity: "payment",
      fields: ["id", "order_id"],
      filters: { id: payment_id },
    }).config({ name: "get-payment" });

    const payment = payments[0];

    logStep({ data: payments }).config({ name: "log-payment" });

    if (!payment) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Payment with ID ${payment_id} not found`
      );
    }

    const orderId = payment.order_id as string;

    // 2. Get the order details
    // @ts-ignore
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: ["id", "email", "metadata", "display_id"],
      filters: { id: orderId },
    }).config({ name: "get-order" });

    const order = orders[0];

    if (!order) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Order with ID ${orderId} not found`
      );
    }

    logStep({ data: order }).config({ name: "log-order" });

    // 👇 Desactivamos el envío de email:
    // sendNotificationStep([
    //   {
    //     to: order.email!,
    //     channel: "email",
    //     template: templatesNames.PAYMENT_CAPTURED,
    //     data: { order, locale: order.metadata?.locale },
    //   },
    // ]);

    return;
  }
);
