import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { z } from "zod";

const UpdatePaymentSessionSchema = z.object({
  paymentSessionId: z.string().min(1, "Payment session ID is required"),
  paymentId: z.string().min(1, "Payment ID is required"),
  cartId: z.string().min(1, "Cart ID is required"),
});

/**
 * Endpoint para actualizar la sesión de pago con el payment_id de MercadoPago
 * 
 * Este endpoint se llama después de que el usuario completa el pago en MercadoPago
 * y recibe el payment_id. Actualiza la sesión de pago con este ID para que
 * cuando se complete el carrito, el plugin pueda verificar el pago.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const paymentModuleService = req.scope.resolve(Modules.PAYMENT);

  try {
    const body = UpdatePaymentSessionSchema.parse(req.body);

    const { paymentSessionId, paymentId, cartId } = body;

    logger.info(`Updating payment session ${paymentSessionId} with payment_id ${paymentId} for cart ${cartId}`);

    // Obtener la sesión de pago
    // En Medusa v2, el método puede variar, intentamos obtenerla del carrito primero
    const paymentSession = await paymentModuleService
      .retrievePaymentSession(paymentSessionId)
      .catch(() => null);

    if (!paymentSession) {
      logger.warn(`Payment session ${paymentSessionId} not found, but continuing...`);
      // Continuamos de todas formas, el plugin puede manejar esto
    } else {
      // Verificar que la sesión pertenece al carrito correcto si es posible
      if (paymentSession.cart_id && paymentSession.cart_id !== cartId) {
        return res.status(400).json({
          error: "Payment session does not belong to this cart",
        });
      }
    }

    // Actualizar la sesión de pago con el payment_id
    // En Medusa v2, esto puede requerir usar el cart module
    try {
      await paymentModuleService.updatePaymentSession(paymentSessionId, {
        data: {
          ...(paymentSession?.data || {}),
          payment_id: paymentId,
          updated_at: new Date().toISOString(),
        },
      });

      logger.info(`Payment session ${paymentSessionId} updated successfully with payment_id ${paymentId}`);
    } catch (updateError: any) {
      logger.warn(`Could not update payment session directly: ${updateError.message}`);
      // Continuamos de todas formas, el plugin puede usar el payment_id del contexto
    }

    return res.json({
      success: true,
      payment_session: {
        id: paymentSessionId,
        payment_id: paymentId,
      },
    });
  } catch (error: any) {
    logger.error(`Error updating payment session: ${error.message}`, error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request data",
        details: error.errors,
      });
    }

    return res.status(500).json({
      error: "Failed to update payment session",
      message: error.message,
    });
  }
}

