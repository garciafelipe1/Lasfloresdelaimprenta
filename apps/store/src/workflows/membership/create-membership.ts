import { MembershipType } from "@/shared/types";
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { MEMBERSHIP_MODULE } from "../../modules/membership";
import MembershipModuleService from "../../modules/membership/service";

type CreateMembershipWorkflowInput = Pick<
  MembershipType,
  "name" | "description" | "price" | "id"
>;

const createMembershipStep = createStep(
  "create-membership",
  async (
    { name, description, price, id }: CreateMembershipWorkflowInput,
    { container }
  ) => {
    const membershipModuleService: MembershipModuleService =
      container.resolve(MEMBERSHIP_MODULE);

    const membership = await membershipModuleService.createMemberships({
      name,
      description,
      price,
      id,
    });

    return new StepResponse(membership, membership);
  },
  async (membership, { container }) => {
    const membershipModuleService: MembershipModuleService =
      container.resolve(MEMBERSHIP_MODULE);

    await membershipModuleService.deleteMemberships(membership!.id);
  }
);

export const createMembershipWorkflow = createWorkflow(
  "create-membership",
  (membershipInput: CreateMembershipWorkflowInput) => {
    const membership = createMembershipStep(membershipInput);

    return new WorkflowResponse(membership);
  }
);
