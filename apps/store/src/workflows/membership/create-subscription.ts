import { SubscriptionType } from "@/shared/types";
import { LinkDefinition } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { MEMBERSHIP_MODULE } from "../../modules/membership";
import MembershipModuleService from "../../modules/membership/service";

export type CreateSubscriptionWorkflowInput = Pick<
  SubscriptionType,
  "customer_id" | "external_id" | "membership_id" | "ended_at"
>;

const createSubscriptionStep = createStep(
  "create-subscription",
  async (
    {
      customer_id,
      external_id,
      membership_id,
      ended_at,
    }: CreateSubscriptionWorkflowInput,
    { container }
  ) => {
    const logger = container.resolve("logger");
    const link = container.resolve("link");
    const membershipModuleService: MembershipModuleService =
      container.resolve(MEMBERSHIP_MODULE);

    const membership = await membershipModuleService.retrieveMembership(
      membership_id
    );

    const subscription = await membershipModuleService.createSubscriptions({
      customer_id,
      external_id,
      membership_id,
      ended_at,
      started_at: new Date(),
      status: "active",
      price: membership.price,
    });

    const links: LinkDefinition[] = [
      {
        [MEMBERSHIP_MODULE]: {
          subscription_id: subscription.id,
        },
        [Modules.CUSTOMER]: {
          customer_id: customer_id,
        },
      },
    ];

    try {
      await link.create(links);
      logger.info(
        `Linked customer ${customer_id} to subscription ${subscription.id}`
      );
    } catch (error) {
      logger.error(`Failed to link customer to subscription: ${error.message}`);
    }

    return new StepResponse(subscription, {
      subscription,
      links,
    });
  },
  async (stepResult, { container }) => {
    const { subscription, links } = stepResult as {
      subscription: SubscriptionType;
      links: LinkDefinition[];
    };

    const link = container.resolve("link");

    const subscriptionModuleService: MembershipModuleService =
      container.resolve(MEMBERSHIP_MODULE);

    await subscriptionModuleService.deleteSubscriptions(subscription!.id);

    if (links?.length) {
      await link.dismiss(links);
    }
  }
);

export const createSubscriptionWorkflow = createWorkflow(
  "create-subscription",
  (subscriptionInput: CreateSubscriptionWorkflowInput) => {
    const subscription = createSubscriptionStep(subscriptionInput);

    return new WorkflowResponse(subscription);
  }
);
