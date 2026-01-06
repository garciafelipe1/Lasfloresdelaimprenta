import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { MEMBERSHIP_MODULE } from "../../../../modules/membership";
import MembershipModuleService from "../../../../modules/membership/service";

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const logger = req.scope.resolve("logger");
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const memberId = req.auth_context.actor_id;
  const membershipModuleService: MembershipModuleService =
    req.scope.resolve(MEMBERSHIP_MODULE);

  logger.info(`[SubscriptionMe] ========== OBTENIENDO SUSCRIPCIONES ==========`);
  logger.info(`[SubscriptionMe] Timestamp: ${new Date().toISOString()}`);
  logger.info(`[SubscriptionMe] memberId (customer_id): ${memberId}`);
  logger.info(`[SubscriptionMe] URL: ${req.url}`);
  logger.info(`[SubscriptionMe] Method: ${req.method}`);

  // Intentar primero con GraphQL query (usando links)
  let subscriptions: any[] = [];
  
  logger.info(`[SubscriptionMe] Intentando buscar suscripciones via GraphQL (usando links)...`);
  try {
    const graphQuery = {
      entity: "customer",
      fields: [
        "subscriptions.id",
        "subscriptions.ended_at",
        "subscriptions.started_at",
        "subscriptions.membership_id",
        "subscriptions.status",
        "subscriptions.price",
        "subscriptions.external_id",
        "subscriptions.membership.id",
        "subscriptions.membership.name",
      ],
      filters: {
        id: memberId,
      },
    };
    
    logger.info(`[SubscriptionMe] GraphQL query: ${JSON.stringify(graphQuery, null, 2)}`);
    
    const { data } = await query.graph(graphQuery);

    logger.info(`[SubscriptionMe] GraphQL response recibida. Total de customers: ${data.length}`);
    
    const customer = data[0];
    logger.info(`[SubscriptionMe] Customer encontrado: ${customer ? 'Sí' : 'No'}`);
    
    if (customer) {
      logger.info(`[SubscriptionMe] Customer data: ${JSON.stringify(customer, null, 2)}`);
      subscriptions = customer?.subscriptions ?? [];
      logger.info(`[SubscriptionMe] ✅ Suscripciones encontradas via GraphQL (links): ${subscriptions.length}`);
      
      if (subscriptions.length > 0) {
        logger.info(`[SubscriptionMe] Detalles de suscripciones encontradas:`);
        subscriptions.forEach((sub: any, index: number) => {
          logger.info(`[SubscriptionMe]   [${index}] id: ${sub.id}, status: ${sub.status}, membership_id: ${sub.membership_id}`);
        });
      }
    } else {
      logger.warn(`[SubscriptionMe] ⚠️ No se encontró customer con id: ${memberId}`);
    }
  } catch (error: any) {
    logger.error(`[SubscriptionMe] ❌ Error en GraphQL query: ${error.message}`);
    logger.error(`[SubscriptionMe] Stack: ${error.stack}`);
    logger.error(`[SubscriptionMe] Error completo: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
  }

  // Si no hay suscripciones via GraphQL, buscar directamente por customer_id
  if (subscriptions.length === 0) {
    logger.info(`[SubscriptionMe] ⚠️ No se encontraron suscripciones via GraphQL. Buscando directamente por customer_id...`);
    try {
      logger.info(`[SubscriptionMe] Obteniendo todas las suscripciones del sistema...`);
      const allSubscriptions = await membershipModuleService.listSubscriptions();
      logger.info(`[SubscriptionMe] ✅ Total de suscripciones en el sistema: ${allSubscriptions.length}`);
      
      if (allSubscriptions.length > 0) {
        logger.info(`[SubscriptionMe] Primeras 5 suscripciones (muestra):`);
        allSubscriptions.slice(0, 5).forEach((sub: any, index: number) => {
          logger.info(`[SubscriptionMe]   [${index}] id: ${sub.id}, customer_id: ${sub.customer_id}, status: ${sub.status}, membership_id: ${sub.membership_id}`);
        });
      }
      
      // Filtrar por customer_id manualmente
      logger.info(`[SubscriptionMe] Filtrando suscripciones por customer_id: ${memberId}...`);
      const customerSubscriptions = allSubscriptions.filter((sub: any) => {
        const matches = sub.customer_id === memberId;
        if (matches) {
          logger.info(`[SubscriptionMe]   ✅ Match encontrado: subscription.id=${sub.id}, customer_id=${sub.customer_id}, status=${sub.status}`);
        }
        return matches;
      });
      
      logger.info(`[SubscriptionMe] ✅ Suscripciones encontradas para customer ${memberId}: ${customerSubscriptions.length}`);
      
      if (customerSubscriptions.length > 0) {
        logger.info(`[SubscriptionMe] Detalles de suscripciones encontradas:`);
        customerSubscriptions.forEach((sub: any, index: number) => {
          logger.info(`[SubscriptionMe]   [${index}] ${JSON.stringify(sub, null, 2)}`);
        });
      }
      
      // Convertir a formato compatible con GraphQL response
      logger.info(`[SubscriptionMe] Obteniendo información de membresías para las suscripciones...`);
      subscriptions = await Promise.all(
        customerSubscriptions.map(async (sub: any, index: number) => {
          logger.info(`[SubscriptionMe]   [${index}] Obteniendo membresía ${sub.membership_id}...`);
          try {
            const membership = await membershipModuleService.retrieveMembership(sub.membership_id);
            logger.info(`[SubscriptionMe]   [${index}] ✅ Membresía obtenida: id=${membership.id}, name=${membership.name}`);
            return {
              ...sub,
              membership: {
                id: membership.id,
                name: membership.name,
              },
            };
          } catch (error: any) {
            logger.error(`[SubscriptionMe]   [${index}] ❌ Error al obtener membresía ${sub.membership_id}: ${error.message}`);
            return {
              ...sub,
              membership: {
                id: sub.membership_id,
                name: 'Unknown',
              },
            };
          }
        })
      );
      
      logger.info(`[SubscriptionMe] ✅ Suscripciones convertidas: ${subscriptions.length}`);
    } catch (error: any) {
      logger.error(`[SubscriptionMe] ❌ Error al buscar suscripciones directamente: ${error.message}`);
      logger.error(`[SubscriptionMe] Stack: ${error.stack}`);
      logger.error(`[SubscriptionMe] Error completo: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
    }
  }

  logger.info(`[SubscriptionMe] Total de suscripciones encontradas (antes de búsqueda directa): ${subscriptions.length}`);
  
  // SIEMPRE buscar también directamente por customer_id, incluso si GraphQL devolvió resultados
  // Esto asegura que encontremos todas las suscripciones, independientemente del estado del link
  logger.info(`[SubscriptionMe] 🔍 Buscando también directamente por customer_id (fallback/verificación)...`);
  try {
    const allSubscriptions = await membershipModuleService.listSubscriptions();
    logger.info(`[SubscriptionMe] ✅ Total de suscripciones en el sistema: ${allSubscriptions.length}`);
    
    // Filtrar por customer_id manualmente
    const customerSubscriptionsDirect = allSubscriptions.filter((sub: any) => {
      return sub.customer_id === memberId;
    });
    
    logger.info(`[SubscriptionMe] ✅ Suscripciones encontradas directamente para customer ${memberId}: ${customerSubscriptionsDirect.length}`);
    
    if (customerSubscriptionsDirect.length > 0) {
      logger.info(`[SubscriptionMe] Detalles de suscripciones encontradas directamente:`);
      customerSubscriptionsDirect.forEach((sub: any, index: number) => {
        logger.info(`[SubscriptionMe]   [${index}] id=${sub.id}, customer_id=${sub.customer_id}, status=${sub.status}, membership_id=${sub.membership_id}, external_id=${sub.external_id}`);
      });
      
      // Si encontramos suscripciones directamente que no estaban en GraphQL, agregarlas
      const existingIds = new Set(subscriptions.map((s: any) => s.id));
      const newSubscriptions = customerSubscriptionsDirect.filter((sub: any) => !existingIds.has(sub.id));
      
      if (newSubscriptions.length > 0) {
        logger.info(`[SubscriptionMe] ⚠️ Se encontraron ${newSubscriptions.length} suscripciones directamente que no estaban en GraphQL. Agregándolas...`);
        
        // Obtener información de membresía para las nuevas suscripciones
        const newSubscriptionsWithMembership = await Promise.all(
          newSubscriptions.map(async (sub: any) => {
            try {
              const membership = await membershipModuleService.retrieveMembership(sub.membership_id);
              return {
                ...sub,
                membership: {
                  id: membership.id,
                  name: membership.name,
                },
              };
            } catch (error: any) {
              logger.error(`[SubscriptionMe] ❌ Error al obtener membresía ${sub.membership_id}: ${error.message}`);
              return {
                ...sub,
                membership: {
                  id: sub.membership_id,
                  name: 'Unknown',
                },
              };
            }
          })
        );
        
        subscriptions = [...subscriptions, ...newSubscriptionsWithMembership];
        logger.info(`[SubscriptionMe] ✅ Total de suscripciones después de agregar las encontradas directamente: ${subscriptions.length}`);
      }
    }
  } catch (error: any) {
    logger.error(`[SubscriptionMe] ❌ Error en búsqueda directa: ${error.message}`);
    logger.error(`[SubscriptionMe] Stack: ${error.stack}`);
  }

  logger.info(`[SubscriptionMe] Total de suscripciones encontradas (final): ${subscriptions.length}`);
  logger.info(`[SubscriptionMe] Suscripciones (raw, antes del filtro): ${JSON.stringify(subscriptions, null, 2)}`);

  // Filtrar solo suscripciones activas y ordenar por fecha de inicio (más reciente primero)
  logger.info(`[SubscriptionMe] 🔍 Filtrando suscripciones activas...`);
  const activeSubscriptions = subscriptions
    .filter((sub: any) => {
      const isActive = sub.status === 'active';
      logger.info(`[SubscriptionMe]   Suscripción id=${sub.id}, membership_id=${sub.membership_id}, status="${sub.status}", isActive=${isActive}`);
      if (!isActive) {
        logger.info(`[SubscriptionMe]     ⚠️ Suscripción NO activa. Filtrada.`);
      }
      return isActive;
    })
    .sort((a: any, b: any) => {
      const dateA = new Date(a.started_at).getTime();
      const dateB = new Date(b.started_at).getTime();
      return dateB - dateA; // Más reciente primero
    });

  logger.info(`[SubscriptionMe] ✅ Suscripciones activas después del filtro: ${activeSubscriptions.length}`);
  if (activeSubscriptions.length === 0 && subscriptions.length > 0) {
    logger.warn(`[SubscriptionMe] ⚠️⚠️⚠️ PROBLEMA DETECTADO: Se encontraron ${subscriptions.length} suscripción(es) pero NINGUNA está activa:`);
    subscriptions.forEach((sub: any, index: number) => {
      logger.warn(`[SubscriptionMe]   [${index}] id=${sub.id}, status="${sub.status}", membership_id=${sub.membership_id}`);
    });
  }
  logger.info(`[SubscriptionMe] Suscripciones activas (final): ${JSON.stringify(activeSubscriptions, null, 2)}`);
  logger.info(`[SubscriptionMe] ========== FIN DE OBTENCIÓN DE SUSCRIPCIONES ==========`);

  // Devolver array de suscripciones activas (el frontend toma el primer elemento)
  return res.json(activeSubscriptions);
}
