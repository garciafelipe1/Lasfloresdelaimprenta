import { sendOrderConfirmationOnPaymentCapturedWorkflow } from "@/workflows/payment-captured-confirmation";
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await sendOrderConfirmationOnPaymentCapturedWorkflow(container).run({
    input: {
      payment_id: data.id,
    },
  });
}

export const config: SubscriberConfig = {
  event: "payment.captured",
};
