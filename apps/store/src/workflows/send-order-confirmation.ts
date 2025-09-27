import { templatesNames } from "@/modules/resend/service";
import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { sendNotificationStep } from "./steps/send-notification";

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

    const notification = sendNotificationStep([
      {
        to: order.email!,
        channel: "email",
        template: templatesNames.ORDER_PLACED,
        data: {
          order: order,
          locale: order.metadata?.locale,
        },
      },
    ]);

    return new WorkflowResponse(notification);
  }
);
