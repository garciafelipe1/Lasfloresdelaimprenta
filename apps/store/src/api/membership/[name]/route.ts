import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";
import { MEMBERSHIP_MODULE } from "../../../modules/membership";
import MembershipModuleService from "../../../modules/membership/service";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const name = req.params.name;
  const membershipService: MembershipModuleService =
    req.scope.resolve(MEMBERSHIP_MODULE);

  const membership = await membershipService.retrieveMembership(name);

  if (!membership) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Membership with name ${name} not found`
    );
  }

  res.json(membership);
}
