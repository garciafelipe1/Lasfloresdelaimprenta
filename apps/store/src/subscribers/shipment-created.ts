import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { shipmentCreatedConfirmationWorkflow } from "../workflows/shipment-created-confirmation";

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; no_notification: boolean }>) {
  // Here i have the shipment id, not the order
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  logger.info(JSON.stringify(data));

  if (data.no_notification) {
    logger.info("USUARIO NO VA A SER NOTIFICADO");
    return;
  }

  logger.info("NOTIFICANDO AL USUARIO");
  await shipmentCreatedConfirmationWorkflow(container).run({
    input: {
      shipmentId: data.id,
    },
  });
}

export const config: SubscriberConfig = {
  event: "shipment.created",
};
