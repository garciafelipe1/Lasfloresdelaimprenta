import { SubscriptionType } from "@/shared/types";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { z } from "zod";

export type Member = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  subscriptions: SubscriptionType[];
};

export const memberSchema = z.object({
  email: z.string(),
  id: z.string(),
  name: z.string(),
  status: z.enum(["active", "pending", "cancelled"]),
  membershipId: z.string(),
  startedAt: z.date(),
});

export type MemberDTO = z.infer<typeof memberSchema>;

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const result = await query.graph({
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
    ],
  });

  const output = result.data.map((customer) => {
    if (!customer.subscriptions) {
      return;
    }

    const primarySubscription = customer.subscriptions[0];

    if (!primarySubscription) {
      return;
    }

    return memberSchema.parse({
      email: customer.email,
      id: customer.id,
      name: `${customer.first_name} ${customer.last_name}`,
      status: primarySubscription.status,
      membershipId: primarySubscription.membership_id,
      startedAt: primarySubscription.started_at,
    });
  });

  res.json(output);
}
