import { MedusaError } from "@medusajs/framework/utils";
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import z from "zod";
import { MEMBERSHIP_MODULE } from "../../modules/membership";
import MembershipModuleService from "../../modules/membership/service";

type UpdateMembershipWorkflowInput = {
  id: string;
  name?: string;
  description?: string;
  price?: number;
};

const membershipNameSchema = z.object({
  name: z.enum(["Esencial", "Premium", "Elite"]),
});

const updateMembershipStep = createStep(
  "update-membership",
  async (
    { id, description, name, price }: UpdateMembershipWorkflowInput,
    { container }
  ) => {
    const membershipModuleService: MembershipModuleService =
      container.resolve(MEMBERSHIP_MODULE);

    const existing = await membershipModuleService.retrieveMembership(id);

    const validName = membershipNameSchema.safeParse({ name });
    if (!validName.success) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Invalid membership name: ${name}. Valid names are: ${validName.error.issues
          .map((issue) => issue.message)
          .join(", ")}`
      );
    }

    const updated = await membershipModuleService.updateMemberships({
      id,
      name: validName.data.name,
      description,
      price,
    });

    return new StepResponse(updated, existing); // store previous state for rollback
  },
  async (previousMembership, { container }) => {
    const membershipModuleService: MembershipModuleService =
      container.resolve(MEMBERSHIP_MODULE);

    // rollback to previous values
    await membershipModuleService.updateMemberships(
      {
        id: previousMembership!.id,
      },
      {
        name: previousMembership!.name,
        description: previousMembership!.description,
        price: previousMembership!.price,
      }
    );
  }
);

export const updateMembershipWorkflow = createWorkflow(
  "update-membership",
  (input: UpdateMembershipWorkflowInput) => {
    const updated = updateMembershipStep(input);
    return new WorkflowResponse(updated);
  }
);
