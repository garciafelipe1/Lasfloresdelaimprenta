import type { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { createSubscriptionWorkflow } from "../workflows/membership/create-subscription";
import { MEMBERSHIP_MODULE } from "../modules/membership";

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v?.trim()) {
    throw new Error(`Falta env ${name}`);
  }
  return v.trim();
}

function parseEndsInDays(): number {
  const raw = process.env.ENDS_IN_DAYS;
  const n = raw ? Number(raw) : 365;
  if (!Number.isFinite(n) || n <= 0) return 365;
  return Math.floor(n);
}

export default async function activateSubscription({ container }: ExecArgs) {
  const logger = container.resolve("logger");

  const email = requiredEnv("EMAIL").toLowerCase();
  const membershipId = (process.env.MEMBERSHIP_ID?.trim() || "esencial") as
    | "esencial"
    | "premium"
    | "elite";

  const endsInDays = parseEndsInDays();
  const endedAt = new Date();
  endedAt.setDate(endedAt.getDate() + endsInDays);

  const customerModule = container.resolve(Modules.CUSTOMER);
  const membershipModule = container.resolve(MEMBERSHIP_MODULE) as {
    listSubscriptions: (filters?: Record<string, unknown>) => Promise<
      { id: string; customer_id: string }[]
    >;
    deleteSubscriptions: (id: string) => Promise<unknown>;
  };

  const customers = await customerModule.listCustomers({ email }, { take: 5 });
  const customer = customers?.[0];
  if (!customer?.id) {
    throw new Error(`No se encontró customer con email ${email}`);
  }

  // Por diseño, subscription.customer_id es UNIQUE. Si existe, la borramos y recreamos.
  const existing = await membershipModule.listSubscriptions({
    customer_id: customer.id,
  });
  if (existing?.length) {
    logger.info(
      `[activate-subscription] borrando suscripción previa ${existing[0].id} de customer ${customer.id}`,
    );
    await membershipModule.deleteSubscriptions(existing[0].id);
  }

  logger.info(
    `[activate-subscription] creando suscripción active para ${email} (customer ${customer.id}) plan=${membershipId} endsInDays=${endsInDays}`,
  );

  await createSubscriptionWorkflow(container).run({
    input: {
      customer_id: customer.id,
      external_id: "manual-activate",
      membership_id: membershipId,
      ended_at: endedAt,
    },
  });

  logger.info("[activate-subscription] OK");
}

