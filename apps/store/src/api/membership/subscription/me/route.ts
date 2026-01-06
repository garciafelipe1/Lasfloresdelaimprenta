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
      "subscriptions.membership.id",
      "subscriptions.membership.name",
    ],
    filters: {
      id: memberId,
    },
  });

  const customer = data[0];
  const subscriptions = customer?.subscriptions ?? [];

  // Filtrar solo suscripciones activas y ordenar por fecha de inicio (más reciente primero)
  const activeSubscriptions = subscriptions
    .filter((sub: any) => sub.status === 'active')
    .sort((a: any, b: any) => {
      const dateA = new Date(a.started_at).getTime();
      const dateB = new Date(b.started_at).getTime();
      return dateB - dateA; // Más reciente primero
    });

  return res.json(activeSubscriptions);
}
