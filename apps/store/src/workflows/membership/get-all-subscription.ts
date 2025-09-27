import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { MEMBERSHIP_MODULE } from "../../modules/membership";
import MembershipModuleService from "../../modules/membership/service";

const getAllSubscriptionsStep = createStep(
  "get-subscriptions",
  async (input: void, { container }) => {
    const membershipModuleService: MembershipModuleService =
      container.resolve(MEMBERSHIP_MODULE);

    const subscriptions = await membershipModuleService.listSubscriptions();
    return new StepResponse(subscriptions);
  }
);

export const getSubscriptionsWorkflow = createWorkflow(
  "get-subscriptions",
  () => {
    const subscriptions = getAllSubscriptionsStep();
    return new WorkflowResponse(subscriptions);
  }
);
