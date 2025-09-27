import { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { createSubscriptionWorkflow } from "../workflows/membership/create-subscription";
import { customersSeed } from "./seed/customers.seed";

export default async function seedSubs({ container }: ExecArgs) {
  const customerModuleService = container.resolve(Modules.CUSTOMER);
  const customers = await customerModuleService.listCustomers();
  const logger = container.resolve("logger");

  const results = await Promise.allSettled(
    customersSeed.map(async ({ email, first_name, last_name, membership }) => {
      try {
        const seededCustomer = await customerModuleService.createCustomers({
          email,
          first_name,
          last_name,
        });

        await createSubscriptionWorkflow(container).run({
          input: {
            customer_id: seededCustomer.id,
            external_id: "mercado-pago-id",
            membership_id: membership,
            ended_at: new Date(),
          },
        });
      } catch (err) {
        console.error(`Failed to seed ${email}:`, err);
        throw err;
      }
    })
  );

  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length) {
    logger.error(`${failed.length} seeds failed.`);
  }
}
