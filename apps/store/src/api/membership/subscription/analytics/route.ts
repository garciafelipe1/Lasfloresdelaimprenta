import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { getSubscriptionAnalyticsWorkflow } from "../../../../workflows/membership/get-subscription-analytics";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { result: subscriptions } = await getSubscriptionAnalyticsWorkflow(
    req.scope
  ).run();

  res.json(subscriptions);
}
