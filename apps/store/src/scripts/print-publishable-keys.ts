import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Imprime API keys publishable existentes en la DB.
 * Útil en Railway para copiar la key y pegarla en Vercel como:
 * NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
 */
export default async function printPublishableKeys({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data } = await query.graph({
    entity: "api_key",
    fields: ["id", "title", "type", "token", "created_at"],
  });

  const publishables = (data || []).filter((k: any) => k?.type === "publishable");

  if (!publishables.length) {
    logger.warn("No hay api_keys publishable en la DB (corré seed primero).");
    return;
  }

  logger.info(`Publishable keys encontradas: ${publishables.length}`);
  for (const k of publishables) {
    logger.info(`- ${k.title ?? "(sin título)"} [${k.id}]`);
    logger.info(`  token: ${k.token}`);
  }
}


