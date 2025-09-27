import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { MEMBERSHIP_MODULE } from "../../modules/membership";
import MembershipModuleService from "../../modules/membership/service";

const getAllMembershipsStep = createStep(
  "get-memberships",
  async (input: void, { container }) => {
    const membershipModuleService: MembershipModuleService =
      container.resolve(MEMBERSHIP_MODULE);

    const memberships = await membershipModuleService.listMemberships();
    return new StepResponse(memberships);
  }
);

export const getMembershipsWorkflow = createWorkflow("get-memberships", () => {
  const memberships = getAllMembershipsStep();
  return new WorkflowResponse(memberships);
});
