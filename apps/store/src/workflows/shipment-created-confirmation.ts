import { ShipmentCreatedEmailProps } from "@/modules/resend/emails/shipment-created";
import { templatesNames } from "@/modules/resend/service";
import { MedusaError } from "@medusajs/framework/utils";
import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { logStep } from "./steps/log";
import { sendNotificationStep } from "./steps/send-notification";

type WorkflowInput = {
  shipmentId: string;
};

export const shipmentCreatedConfirmationWorkflow = createWorkflow(
  "shipment-created-confirmation",
  ({ shipmentId }: WorkflowInput) => {
    // 1. Get the shipment and its order_id
    // @ts-ignore
    const { data: shipments } = useQueryGraphStep({
      entity: "fulfillment",
      fields: [
        "id",
        "labels.tracking_number",
        "order.email",
        "order.id",
        "order.metadata",
      ],
      filters: { id: shipmentId },
    });

    const shipment = shipments[0];

    if (!shipment) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Order not found for shipment with id ${shipmentId}`
      );
    }

    const order = shipment.order;

    if (!order) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Order not found for shipment with id ${shipmentId}`
      );
    }

    const data: ShipmentCreatedEmailProps = {
      trackingNumber: shipment.labels[0].tracking_number,
      order: {
        id: order.id,
      },
      locale: order.metadata?.locale as "es",
    };

    logStep({ data }).config({ name: "log-order" });

    const notification = sendNotificationStep([
      {
        to: order.email!,
        channel: "email",
        template: templatesNames.SHIPMENT_CREATED,
        data: {
          ...data,
        },
      },
    ]);

    return new WorkflowResponse(notification);
  }
);
