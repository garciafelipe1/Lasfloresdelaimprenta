import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createShippingOptionsWorkflow } from "@medusajs/medusa/core-flows";
import { BAHIA_BLANCA_SHIPPING_CODES } from "../shared/constants";

/**
 * Crea (si no existe) la opción de envío:
 * - Nombre: "Envío a confirmar"
 * - Type code: "envio-a-confirmar"
 * - Precio: 0 (se confirma por WhatsApp)
 *
 * Estrategia: reutiliza service_zone_id / shipping_profile_id / provider_id de
 * cualquier shipping option existente de Bahía Blanca (type.code = "bahia-blanca"),
 * para no depender de nombres internos.
 */
export default async function createEnvioAConfirmarShippingOption({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code"],
  });

  const region =
    (regions || []).find((r: any) => String(r?.currency_code).toLowerCase() === "ars") ||
    regions?.[0];

  if (!region?.id) {
    throw new Error("[envio-a-confirmar] No se encontró una región (ARS).");
  }

  const { data: shippingOptions } = await query.graph({
    entity: "shipping_option",
    fields: [
      "id",
      "name",
      "price_type",
      "provider_id",
      "service_zone_id",
      "shipping_profile_id",
      "type.code",
    ],
  });

  const existing = (shippingOptions || []).find(
    (o: any) => o?.type?.code === BAHIA_BLANCA_SHIPPING_CODES.envioAConfirmar,
  );

  if (existing?.id) {
    logger.info(
      `[envio-a-confirmar] Ya existe: "${existing.name}" (id=${existing.id}). Nada para hacer.`,
    );
    return;
  }

  const template = (shippingOptions || []).find(
    (o: any) => o?.type?.code === BAHIA_BLANCA_SHIPPING_CODES.bahiaBlanca,
  );

  if (!template?.service_zone_id || !template?.shipping_profile_id || !template?.provider_id) {
    throw new Error(
      `[envio-a-confirmar] No se encontró una shipping option template con type.code="${BAHIA_BLANCA_SHIPPING_CODES.bahiaBlanca}". Corré el seed de envíos o creá una opción de envío primero.`,
    );
  }

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Envío a confirmar",
        price_type: "flat",
        provider_id: template.provider_id,
        service_zone_id: template.service_zone_id,
        shipping_profile_id: template.shipping_profile_id,
        type: {
          label: "A confirmar",
          description:
            "Durante fechas pico, el costo final del envío se confirma por WhatsApp antes del despacho.",
          code: BAHIA_BLANCA_SHIPPING_CODES.envioAConfirmar,
        },
        prices: [
          { currency_code: "ars", amount: 0 },
          { currency_code: "usd", amount: 0 },
          { region_id: region.id, amount: 0 },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      } as any,
    ],
  });

  logger.info('[envio-a-confirmar] ✅ Creada la opción "Envío a confirmar".');
}

