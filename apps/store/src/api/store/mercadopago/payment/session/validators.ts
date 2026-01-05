import { z } from "zod";

export const UpdatePaymentSessionSchema = z.object({
  paymentSessionId: z.string().optional(), // Opcional: si no se proporciona, se buscará por cartId
  paymentId: z.string().min(1, "Payment ID is required"),
  cartId: z.string().min(1, "Cart ID is required"),
});

export type UpdatePaymentSessionSchemaType = z.infer<typeof UpdatePaymentSessionSchema>;

