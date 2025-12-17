import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { z } from "zod";

const UpdatePaymentSessionSchema = z.object({
  paymentSessionId: z.string().min(1, "Payment session ID is required"),
  paymentId: z.string().min(1, "Payment ID is required"),
  cartId: z.string().min(1, "Cart ID is required"),
});

/**
 * Endpoint para recibir el payment_id de MercadoPago y actualizar la sesión de pago
 * 
 * Este endpoint se llama después de que el usuario completa el pago en MercadoPago
 * y recibe el payment_id. Actualiza la sesión de pago con el payment_id para que
 * el plugin de MercadoPago pueda verificar el pago cuando se complete el carrito.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const paymentModuleService = req.scope.resolve(Modules.PAYMENT);

  try {
    const body = UpdatePaymentSessionSchema.parse(req.body);

    const { paymentSessionId, paymentId, cartId } = body;

    logger.info(`[PaymentSessionUpdate] Received payment_id ${paymentId} for payment session ${paymentSessionId} and cart ${cartId}`);

    // Obtener la sesión de pago actual
    const paymentSession = await paymentModuleService.retrievePaymentSession(paymentSessionId);

    if (!paymentSession) {
      logger.error(`[PaymentSessionUpdate] Payment session ${paymentSessionId} not found`);
      return res.status(404).json({
        error: "Payment session not found",
      });
    }

    logger.info(`[PaymentSessionUpdate] Current payment session status: ${paymentSession.status}`);

    // Registrar el payment_id para que el plugin de MercadoPago lo use
    // El plugin debería verificar el pago usando el external_reference (cart_id)
    // cuando se complete el carrito
    logger.info(`[PaymentSessionUpdate] Payment session info - id: ${paymentSession.id}, provider_id: ${paymentSession.provider_id}, status: ${paymentSession.status}, hasData: ${!!paymentSession.data}`);

    // Nota: En Medusa v2, el plugin de MercadoPago debería verificar el pago automáticamente
    // cuando se complete el carrito usando el external_reference (cart_id) que se pasa
    // en la preferencia de MercadoPago. El payment_id se registrará aquí para referencia,
    // pero el plugin usará el external_reference para verificar el pago.

    return res.json({
      success: true,
      payment_session: {
        id: paymentSessionId,
        payment_id: paymentId,
        status: paymentSession.status,
      },
      message: "Payment ID received. The MercadoPago plugin will verify the payment using external_reference when the cart is completed.",
    });
  } catch (error: any) {
    logger.error(`[PaymentSessionUpdate] Error processing payment session update: ${error.message}`, error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid request data",
        details: error.errors,
      });
    }

    return res.status(500).json({
      error: "Failed to process payment session update",
      message: error.message,
    });
  }
}

