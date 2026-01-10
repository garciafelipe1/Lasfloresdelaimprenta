import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

// TODO: Implementar workflow de confirmación de delivery cuando esté listo
// import { deliveryCreatedConfirmationWorkflow } from "@/workflows/delivery-created-confirmation";

export default async function deliveryCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  // Subscriber temporal - implementar cuando el workflow esté listo
  // await deliveryCreatedConfirmationWorkflow(container).run({
  //   input: {
  //     fulfillment_id: data.id,
  //   },
  // });
  console.log("[delivery-created] Event received for fulfillment:", data.id);
}

export const config: SubscriberConfig = {
  event: "delivery.created",
};
