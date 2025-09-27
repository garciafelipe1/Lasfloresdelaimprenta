// import { DeliveryCreatedEmailProps } from "@/modules/resend/emails/delivery-created";
// import { templatesNames } from "@/modules/resend/service";
// import { createWorkflow } from "@medusajs/framework/workflows-sdk";
// import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
// import z from "zod";
// import { logStep } from "./steps/log";
// import { sendNotificationStep } from "./steps/send-notification";

// type WorkflowInput = { fulfillment_id: string };

// const schema = z.object({
//   order: z.object({
//     id: z.string(),
//   }),
//   locale: z.string().default("es"),
// });

// export const deliveryCreatedConfirmationWorkflow = createWorkflow(
//   "delivery-created-confirmation",
//   ({ fulfillment_id }: WorkflowInput) => {
//     // 1. Get the payment and its associated order
//     // @ts-ignore
//     const { data: fulfillments } = useQueryGraphStep({
//       entity: "fulfillment",
//       fields: ["id", "order.id", "order.email", "order.metadata"],
//       filters: { id: fulfillment_id },
//       options: {
//         throwIfKeyNotFound: true,
//       },
//     }).config({ name: "get-fullfilment" });

//     const fulfillment = fulfillments[0];

//     logStep({ data: fulfillment }).config({ name: "log-payment" });

//     const parsedInput = schema.parse({
//       order: {
//         id: fulfillment.order?.id,
//       },
//       locale: fulfillment.order?.metadata,
//     });

//     const payload: DeliveryCreatedEmailProps = {
//       order: {
//         id: fulfillment.order.id,
//       },
//       locale: fulfillment.order!.metadata,
//     };

//     // 3. Send the notification
//     sendNotificationStep([
//       {
//         to: fulfillment.order!.email!,
//         channel: "email",
//         template: templatesNames.PAYMENT_CAPTURED,
//         data: { ...payload },
//       },
//     ]);
//   }
// );
