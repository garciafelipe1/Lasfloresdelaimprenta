// import { deliveryCreatedConfirmationWorkflow } from "@/workflows/delivery-created-confirmation";
// import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

// export default async function orderPlacedHandler({
//   event: { data },
//   container,
// }: SubscriberArgs<{ id: string }>) {
//   await deliveryCreatedConfirmationWorkflow(container).run({
//     input: {
//       fulfillment_id: data.id,
//     },
//   });
// }

// export const config: SubscriberConfig = {
//   event: "delivery.created",
// };
