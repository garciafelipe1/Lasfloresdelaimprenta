import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createStep } from "@medusajs/framework/workflows-sdk";

export const logStep = createStep(
  "log-step",
  async ({ data }: { data: any }, { container }) => {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    logger.info(`Logging step: ${JSON.stringify(data)}`);
    return;
  }
);
