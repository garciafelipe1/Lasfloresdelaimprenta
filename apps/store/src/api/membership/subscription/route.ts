import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { loadEnv } from "@medusajs/framework/utils";
import { MercadoPagoConfig, PreApproval } from "mercadopago";
import { externalReferenceSchema } from "../../../lib/zod/mercado-pago-external-reference";
import { createSubscriptionWorkflow } from "../../../workflows/membership/create-subscription";
import { getSubscriptionsWorkflow } from "../../../workflows/membership/get-all-subscription";
import { WebhookSubscriptionSchemaType } from "./validators";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

export const mercadoPagoClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { result: subscriptions } = await getSubscriptionsWorkflow(
    req.scope
  ).run();

  res.json(subscriptions);
}

export async function POST(
  req: MedusaRequest<WebhookSubscriptionSchemaType>,
  res: MedusaResponse
) {
  if (req.validatedBody.type === "subscription_preapproval") {
    const preapproval = await new PreApproval(mercadoPagoClient).get({
      id: req.validatedBody.data.id,
    });

    // Si se aprueba, actualizamos el usuario con el id de la suscripción
    if (preapproval.status === "authorized") {
      const result = externalReferenceSchema.safeParse(
        JSON.parse(preapproval.external_reference!)
      );

      if (!result.success) {
        console.log(preapproval.external_reference);
        throw new Error("External reference doesnt have enough information");
      }

      try {
        await createSubscriptionWorkflow(req.scope).run({
          input: {
            customer_id: result.data.userId,
            external_id: preapproval.id!,
            membership_id: result.data.membershipId,
            ended_at: new Date(preapproval.next_payment_date!),
          },
        });
      } catch (error) {
        console.error({ error });
      }
    }
  }

  res.json({});
}
