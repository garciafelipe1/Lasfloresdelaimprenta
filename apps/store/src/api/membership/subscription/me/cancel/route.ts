import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { MEMBERSHIP_MODULE } from "../../../../../modules/membership";
import MembershipModuleService from "../../../../../modules/membership/service";

export async function PUT(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const logger = req.scope.resolve("logger");
  const memberId = req.auth_context.actor_id;
  const membershipModuleService: MembershipModuleService =
    req.scope.resolve(MEMBERSHIP_MODULE);

  logger.info(`[CancelSubscription] ========== CANCELANDO SUSCRIPCIÓN ==========`);
  logger.info(`[CancelSubscription] Timestamp: ${new Date().toISOString()}`);
  logger.info(`[CancelSubscription] memberId (customer_id): ${memberId}`);

  try {
    // Obtener todas las suscripciones del usuario
    const allSubscriptions = await membershipModuleService.listSubscriptions();
    const userSubscriptions = allSubscriptions.filter(
      (sub: any) => sub.customer_id === memberId && sub.status === 'active'
    );

    if (userSubscriptions.length === 0) {
      logger.warn(`[CancelSubscription] ⚠️ No se encontraron suscripciones activas para el usuario ${memberId}`);
      return res.status(404).json({
        message: "No se encontró una suscripción activa para cancelar",
      });
    }

    // Cancelar todas las suscripciones activas del usuario
    const cancelledSubscriptions: string[] = [];
    for (const subscription of userSubscriptions) {
      try {
        logger.info(`[CancelSubscription] Cancelando suscripción ${subscription.id}...`);
        await membershipModuleService.updateSubscriptions({
          id: subscription.id,
          status: 'cancelled',
        });
        cancelledSubscriptions.push(subscription.id);
        logger.info(`[CancelSubscription] ✅ Suscripción ${subscription.id} cancelada exitosamente`);
      } catch (error: any) {
        logger.error(`[CancelSubscription] ❌ Error al cancelar suscripción ${subscription.id}: ${error.message}`);
        throw error;
      }
    }

    logger.info(`[CancelSubscription] ✅ ${cancelledSubscriptions.length} suscripción(es) cancelada(s) exitosamente`);
    logger.info(`[CancelSubscription] ========== FIN DE CANCELACIÓN ==========`);

    return res.json({
      message: "Suscripción cancelada exitosamente",
      cancelledSubscriptions: cancelledSubscriptions,
    });
  } catch (error: any) {
    logger.error(`[CancelSubscription] ❌ Error al cancelar suscripción: ${error.message}`);
    logger.error(`[CancelSubscription] Stack: ${error.stack}`);
    return res.status(500).json({
      message: "Error al cancelar la suscripción",
      error: error.message,
    });
  }
}

