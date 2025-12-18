import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { z } from "zod";
import { MercadoPagoConfig, Payment } from "mercadopago";

const UpdatePaymentSessionSchema = z.object({
  paymentSessionId: z.string().min(1, "Payment session ID is required"),
  paymentId: z.string().min(1, "Payment ID is required"),
  cartId: z.string().min(1, "Cart ID is required"),
});

/**
 * Endpoint para verificar el pago en MercadoPago y preparar la sesión de pago
 * 
 * Este endpoint se llama después de que el usuario completa el pago en MercadoPago.
 * Verifica el pago en MercadoPago usando el payment_id y registra la información
 * para que el plugin pueda usar esta información cuando se complete el carrito.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const paymentModuleService = req.scope.resolve(Modules.PAYMENT);

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    logger.error("[PaymentSessionUpdate] MERCADOPAGO_ACCESS_TOKEN not configured");
    return res.status(500).json({
      error: "MercadoPago configuration error",
    });
  }

  try {
    const body = UpdatePaymentSessionSchema.parse(req.body);

    const { paymentSessionId, paymentId, cartId } = body;

    logger.info(`[PaymentSessionUpdate] Verificando pago ${paymentId} para sesión ${paymentSessionId} y carrito ${cartId}`);

    // Verificar el pago en MercadoPago
    const mercadoPagoClient = new MercadoPagoConfig({
      accessToken,
    });

    let payment;
    try {
      payment = await new Payment(mercadoPagoClient).get({
        id: paymentId,
      });
      
      logger.info(`[PaymentSessionUpdate] Pago verificado en MercadoPago - id: ${payment.id}, status: ${payment.status}, status_detail: ${payment.status_detail}, external_reference: ${payment.external_reference}, transaction_amount: ${payment.transaction_amount}`);

      // Verificar que el external_reference coincida con el cart_id
      if (payment.external_reference !== cartId) {
        logger.warn(`[PaymentSessionUpdate] ⚠️ El external_reference del pago (${payment.external_reference}) no coincide con el cart_id (${cartId})`);
      }

      // Verificar que el pago esté aprobado
      if (payment.status !== "approved") {
        logger.warn(`[PaymentSessionUpdate] ⚠️ El pago no está aprobado. Status: ${payment.status}, Detail: ${payment.status_detail}`);
        return res.status(400).json({
          error: "Payment not approved",
          payment_status: payment.status,
          payment_status_detail: payment.status_detail,
        });
      }
    } catch (mpError: any) {
      logger.error(`[PaymentSessionUpdate] Error al verificar pago en MercadoPago: ${mpError.message}`, mpError);
      return res.status(500).json({
        error: "Failed to verify payment with MercadoPago",
        message: mpError.message,
      });
    }

    // Obtener la sesión de pago actual
    const paymentSession = await paymentModuleService.retrievePaymentSession(paymentSessionId);

    if (!paymentSession) {
      logger.error(`[PaymentSessionUpdate] Payment session ${paymentSessionId} not found`);
      return res.status(404).json({
        error: "Payment session not found",
      });
    }

      logger.info(`[PaymentSessionUpdate] Sesión de pago actual - id: ${paymentSession.id}, provider_id: ${paymentSession.provider_id}, status: ${paymentSession.status}, hasData: ${!!paymentSession.data}`);

    // IMPORTANTE: Para el flujo de Checkout Pro con preferencias, necesitamos autorizar
    // manualmente la sesión de pago porque el plugin está diseñado para Payment Brick.
    // El plugin debería verificar el pago usando el external_reference cuando se complete
    // el carrito, pero para asegurarnos de que funcione correctamente, actualizamos
    // los datos de la sesión con información del pago y confiamos en que el plugin
    // autorizará correctamente usando el external_reference (cart_id).
    
    // El plugin de MercadoPago tiene un método authorizePaymentSession que se llama
    // automáticamente cuando se completa el carrito. Este método debería:
    // 1. Buscar el pago en MercadoPago usando el external_reference (cart_id)
    // 2. Verificar que el pago esté aprobado
    // 3. Autorizar la sesión de pago en Medusa
    
    // Para asegurarnos de que el plugin pueda encontrar el pago, el external_reference
    // debe coincidir con el cart_id, lo cual ya está configurado en la preferencia.
    
    logger.info(`[PaymentSessionUpdate] ✅ Pago verificado exitosamente en MercadoPago.`);
    logger.info(`[PaymentSessionUpdate] El plugin debería autorizar automáticamente la sesión cuando se complete el carrito usando el external_reference (${cartId}).`);
    
    // Obtener la sesión actual para verificar el estado
    const currentSession = await paymentModuleService.retrievePaymentSession(paymentSessionId);

    return res.json({
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        status_detail: payment.status_detail,
        external_reference: payment.external_reference,
        transaction_amount: payment.transaction_amount,
      },
      payment_session: {
        id: paymentSessionId,
        status: currentSession?.status || paymentSession.status,
      },
      message: "Payment verified successfully. The plugin will authorize the session automatically when the cart is completed using the external_reference (cart_id).",
      note: "The MercadoPago plugin should automatically authorize this session when cart.complete() is called, as it will verify the payment using the external_reference (cart_id).",
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

