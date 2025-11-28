// import { ShipmentCreatedEmailProps } from "@/modules/resend/emails/shipment-created";
// import { templatesNames } from "@/modules/resend/service";
import { MedusaError } from "@medusajs/framework/utils";
import { createWorkflow } from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
// import { logStep } from "./steps/log";
// import { sendNotificationStep } from "./steps/send-notification";

type WorkflowInput = {
  shipmentId: string;
};

export const shipmentCreatedConfirmationWorkflow = createWorkflow(
  "shipment-created-confirmation",
  ({ shipmentId }: WorkflowInput) => {
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

    // Workflow desactivado: no usamos resend ni mandamos email
    return;
  }
);
