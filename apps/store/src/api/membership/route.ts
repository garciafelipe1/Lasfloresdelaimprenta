import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { getMembershipsWorkflow } from "../../workflows/membership/get-all-membership";
import { updateMembershipWorkflow } from "../../workflows/membership/update-membership";
import { PutMembershipSchemaType } from "./validators";

export async function PUT(
  req: MedusaRequest<PutMembershipSchemaType>,
  res: MedusaResponse
) {
  const { result: city } = await updateMembershipWorkflow(req.scope).run({
    input: {
      id: req.validatedBody.id,
      description: req.validatedBody.description,
      name: req.validatedBody.name,
      price: req.validatedBody.price,
    },
  });

  res.json({
    city,
  });
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { result: memberships } = await getMembershipsWorkflow(req.scope).run();
  res.json(memberships);
}
