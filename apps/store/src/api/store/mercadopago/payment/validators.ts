import { z } from "zod";

export const ConfirmMercadoPagoPaymentSchema = z.object({
  paymentSessionId: z.string().min(1, "Payment session ID is required"),
  paymentData: z.object({
    token: z.string().optional(),
    installments: z.number().optional(),
    payment_method_id: z.string().optional(),
    issuer_id: z.string().optional(),
  }),
});

export type ConfirmMercadoPagoPaymentSchemaType = z.infer<
  typeof ConfirmMercadoPagoPaymentSchema
>;

