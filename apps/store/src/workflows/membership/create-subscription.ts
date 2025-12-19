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
    const customerModuleService = container.resolve(Modules.CUSTOMER);

    logger.info(`[CreateSubscriptionWorkflow] ========== INICIO DE CREACIÓN DE SUSCRIPCIÓN ==========`);
    logger.info(`[CreateSubscriptionWorkflow] customer_id: ${customer_id}`);
    logger.info(`[CreateSubscriptionWorkflow] external_id: ${external_id}`);
    logger.info(`[CreateSubscriptionWorkflow] membership_id: ${membership_id}`);
    logger.info(`[CreateSubscriptionWorkflow] ended_at: ${ended_at}`);

    // Verificar que el customer existe
    try {
      logger.info(`[CreateSubscriptionWorkflow] Verificando que el customer ${customer_id} existe...`);
      const customer = await customerModuleService.retrieveCustomer(customer_id);
      logger.info(`[CreateSubscriptionWorkflow] ✅ Customer encontrado: ${customer.id}, email: ${customer.email}`);
    } catch (error: any) {
      logger.error(`[CreateSubscriptionWorkflow] ❌ Error al verificar customer ${customer_id}: ${error.message}`);
      logger.error(`[CreateSubscriptionWorkflow] Stack: ${error.stack}`);
      throw error;
    }

    // Obtener la membresía
    logger.info(`[CreateSubscriptionWorkflow] Obteniendo membresía ${membership_id}...`);
    const membership = await membershipModuleService.retrieveMembership(
      membership_id
    );
    logger.info(`[CreateSubscriptionWorkflow] ✅ Membresía encontrada: ${membership.id}, nombre: ${membership.name}, precio: ${membership.price}`);

    // Crear la suscripción
    logger.info(`[CreateSubscriptionWorkflow] Creando suscripción...`);
    const subscription = await membershipModuleService.createSubscriptions({
      customer_id,
      external_id,
      membership_id,
      ended_at,
      started_at: new Date(),
      status: "active",
      price: membership.price,
    });
    logger.info(`[CreateSubscriptionWorkflow] ✅ Suscripción creada: ${subscription.id}`);

    // Crear el link entre customer y subscription
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

    logger.info(`[CreateSubscriptionWorkflow] Creando link entre customer ${customer_id} y subscription ${subscription.id}...`);
    try {
      await link.create(links);
      logger.info(
        `[CreateSubscriptionWorkflow] ✅✅✅ Link creado exitosamente: customer ${customer_id} <-> subscription ${subscription.id}`
      );
    } catch (error: any) {
      logger.error(`[CreateSubscriptionWorkflow] ❌ Error al crear link: ${error.message}`);
      logger.error(`[CreateSubscriptionWorkflow] Stack: ${error.stack}`);
      logger.error(`[CreateSubscriptionWorkflow] Error completo: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
      // No lanzamos el error aquí para que la suscripción se cree de todas formas
      // El link puede fallar pero la suscripción ya está creada
    }

    logger.info(`[CreateSubscriptionWorkflow] ========== FIN DE CREACIÓN DE SUSCRIPCIÓN (ÉXITO) ==========`);

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
