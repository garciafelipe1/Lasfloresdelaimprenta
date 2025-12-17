import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { z } from "zod";

const UpdatePaymentSessionSchema = z.object({
  paymentSessionId: z.string().min(1, "Payment session ID is required"),
  paymentId: z.string().min(1, "Payment ID is required"),
  cartId: z.string().min(1, "Cart ID is required"),
});

/**
 * Endpoint para recibir el payment_id de MercadoPago
 * 
 * Este endpoint se llama después de que el usuario completa el pago en MercadoPago
 * y recibe el payment_id. El plugin de MercadoPago manejará la actualización
 * de la sesión de pago cuando se complete el carrito usando el external_reference (cart_id).
 * 
 * Por ahora, este endpoint solo registra la información recibida y retorna éxito.
 * El plugin debería usar el payment_id desde MercadoPago cuando se complete el carrito.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  try {
    const body = UpdatePaymentSessionSchema.parse(req.body);

    const { paymentSessionId, paymentId, cartId } = body;

    logger.info(`Received payment_id ${paymentId} for payment session ${paymentSessionId} and cart ${cartId}`);

    // El plugin de MercadoPago debería manejar el payment_id cuando se complete el carrito
    // usando el external_reference (cart_id) que se pasa en la preferencia.
    // Por ahora, solo registramos la información y retornamos éxito.

    return res.json({
      success: true,
      payment_session: {
        id: paymentSessionId,
        payment_id: paymentId,
      },
      message: "Payment ID received. The MercadoPago plugin will handle the payment when the cart is completed.",
    });
  } catch (error: any) {
    logger.error(`Error processing payment session update: ${error.message}`, error);

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

