// import { templatesNames } from "@/modules/resend/service";
import { createWorkflow } from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
// import { sendNotificationStep } from "./steps/send-notification";

type WorkflowInput = {
  id: string;
};

export const sendOrderConfirmationWorkflow = createWorkflow(
  "send-order-confirmation",
  ({ id }: WorkflowInput) => {
    // @ts-ignore
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "currency_code",
        "total",
        "items.*",
        "shipping_address.*",
        "billing_address.*",
        "shipping_methods.*",
        "customer.*",
        "total",
        "subtotal",
        "discount_total",
        "shipping_total",
        "tax_total",
        "item_subtotal",
        "item_total",
        "item_tax_total",
        "payment_collections.payment_sessions.provider_id",
        "metadata",
      ],
      filters: {
        id,
      },
    });

    const order = orders[0];

    if (!order) {
      // si querés, podrías tirar error, pero no es obligatorio
      return;
    }

    // Notificación desactivada a propósito (no usamos resend)
    // const notification = sendNotificationStep([...]);
    // return new WorkflowResponse(notification);

    return;
  }
);
