import { SubscriptionType } from "@/shared/types";
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { CustomerDTO } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export type MemberDTOO = CustomerDTO & {
  subscriptions: SubscriptionType[];
};

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const memberId = req.params.id;

  const { data } = await query.graph({
    entity: "customer",
    fields: [
      "id",
      "first_name",
      "last_name",
      "email",
      "subscriptions.ended_at",
      "subscriptions.started_at",
      "subscriptions.membership_id",
      "subscriptions.status",
      "subscriptions.price",
    ],
    filters: {
      id: memberId,
    },
  });

  res.json(data[0]);
};
