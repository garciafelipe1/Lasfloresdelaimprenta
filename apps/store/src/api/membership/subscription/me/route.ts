import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const memberId = req.auth_context.actor_id;

  const { data } = await query.graph({
    entity: "customer",
    fields: [
      "subscriptions.ended_at",
      "subscriptions.started_at",
      "subscriptions.membership_id",
      "subscriptions.status",
      "subscriptions.price",
      "subscriptions.membership.name",
    ],
    filters: {
      id: memberId,
    },
  });

  res.json(data[0].subscriptions);
}
