import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { MEMBERSHIP_MODULE } from "../../modules/membership";
import MembershipModuleService from "../../modules/membership/service";

const getSubscriptionAnalyticsStep = createStep(
  "get-subscription-analytics",
  async (input: void, { container }) => {
    const membershipModuleService: MembershipModuleService =
      container.resolve(MEMBERSHIP_MODULE);

    const analytics = await membershipModuleService.getAnalytics();
    return new StepResponse(analytics);
  }
);

export const getSubscriptionAnalyticsWorkflow = createWorkflow(
  "get-subscription-analytics",
  () => {
    const analytics = getSubscriptionAnalyticsStep();
    return new WorkflowResponse(analytics);
  }
);
