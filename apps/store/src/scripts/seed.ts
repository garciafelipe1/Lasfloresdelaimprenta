import { CreateInventoryLevelInput, ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  CreateShippingOptionsWorkflowInput,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";
import { BAHIA_BLANCA_SHIPPING_CODES, CATEGORIES } from "../shared/constants";
import { createMembershipWorkflow } from "../workflows/membership/create-membership";
import { createSubscriptionWorkflow } from "../workflows/membership/create-subscription";
import { savePublishableKey } from "./save-publishable-key";
import { SeedProducts } from "./seed-products";
import { bahiaBlancaCities } from "./seed/bahia-blanca-city.seed";
import { customersSeed } from "./seed/customers.seed";
import { membershipSeed } from "./seed/memberships.seed";

export default async function seedDemoData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const storeModuleService = container.resolve(Modules.STORE);

  const countries = ["ar"];

  logger.info("Seeding store data...");
  const [store] = await storeModuleService.listStores();
  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  // await updateStoresWorkflow(container).run({
  //   input: {
  //     selector: { id: store.id },
  //     update: {
  //       supported_currencies: [
  //         {
  //           currency_code: "ars",
  //           is_default: true,
  //         },
  //         {
  //           currency_code: "usd",
  //         },
  //       ],
  //       default_sales_channel_id: defaultSalesChannel[0].id,
  //       name: "La Floreria De La Imprenta",
  //     },
  //   },
  // });

  if (!defaultSalesChannel.length) {
    // create the default sales channel
    const { result: salesChannelResult } = await createSalesChannelsWorkflow(
      container
    ).run({
      input: {
        salesChannelsData: [
          {
            name: "Default Sales Channel",
          },
        ],
      },
    });
    defaultSalesChannel = salesChannelResult;
  }

  logger.info("Seeding region data...");
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Argentina",
          currency_code: "ars",
          countries,
          payment_providers: [
            "pp_system_default",
            "pp_mercadopago_mercadopago",
          ],
        },
      ],
    },
  });
  const region = regionResult[0];

  logger.info("Finished seeding regions.");

  logger.info("Seeding tax regions...");
  await createTaxRegionsWorkflow(container).run({
    input: countries.map((country_code) => ({
      country_code,
    })),
  });
  logger.info("Finished seeding tax regions.");

  logger.info("Seeding stock location data...");
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "La Floreria De La Imprenta",
          address: {
            city: "Bahía Blanca",
            country_code: "ar",
            address_1: "Calle Falsa 123",
            province: "Buenos Aires",
            postal_code: "xxxx",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        supported_currencies: [
          {
            currency_code: "ars",
            is_default: true,
          },
          {
            currency_code: "usd",
          },
        ],
        default_sales_channel_id: defaultSalesChannel[0].id,
        name: "La Floreria De La Imprenta",
        default_region_id: region.id,
        default_location_id: stockLocation.id,
      },
    },
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  });

  logger.info("Seeding fulfillment data...");
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });
  let shippingProfile = shippingProfiles.length ? shippingProfiles[0] : null;

  if (!shippingProfile) {
    const { result: shippingProfileResult } =
      await createShippingProfilesWorkflow(container).run({
        input: {
          data: [
            {
              name: "Default Shipping Profile",
              type: "default",
            },
          ],
        },
      });
    shippingProfile = shippingProfileResult[0];
  }

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "European Warehouse delivery",
    type: "shipping",
    service_zones: [
      {
        name: "Argentina",
        geo_zones: [
          {
            country_code: "ar",
            type: "country",
          },
        ],
      },
    ],
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  });

  const PickupFulfillmentSets =
    await fulfillmentModuleService.createFulfillmentSets({
      name: "Pick-up",
      type: "pick-up",
    });

  const pickupServiceZones = await fulfillmentModuleService.createServiceZones([
    {
      name: "Local Pickup Zone",
      fulfillment_set_id: PickupFulfillmentSets.id, // ID of your pick-up fulfillment set
      geo_zones: [
        {
          type: "country",
          country_code: "ar", // Example: Argentina
        },
      ],
    },
  ]);

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: PickupFulfillmentSets.id,
    },
  });

  const cities: CreateShippingOptionsWorkflowInput = bahiaBlancaCities.map(
    (city) => ({
      name: city.name,
      price_type: "flat",
      provider_id: "manual_manual",
      service_zone_id: fulfillmentSet.service_zones[0].id,
      shipping_profile_id: shippingProfile.id,
      type: {
        label: "Standard",
        description: "Ship in 2-3 days.",
        code: BAHIA_BLANCA_SHIPPING_CODES.bahiaBlanca,
      },
      prices: [
        {
          currency_code: "usd",
          amount: 10,
        },
        {
          currency_code: "ars",
          amount: city.shipping_price,
        },
        {
          region_id: region.id,
          amount: city.shipping_price,
        },
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
    })
  );

  await createShippingOptionsWorkflow(container).run({
    input: [
      ...cities,
      {
        name: "Envío a confirmar",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "A confirmar",
          description:
            "Durante fechas pico, el costo final del envío se confirma por WhatsApp antes del despacho.",
          code: BAHIA_BLANCA_SHIPPING_CODES.envioAConfirmar,
        },
        prices: [
          {
            currency_code: "usd",
            amount: 0,
          },
          {
            currency_code: "ars",
            amount: 0,
          },
          {
            region_id: region.id,
            amount: 0,
          },
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
      },
      {
        name: "Retiro en el local",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: pickupServiceZones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Pickup",
          description: "Retiro en el local de Bahía Blanca.",
          code: BAHIA_BLANCA_SHIPPING_CODES.retiroLocal,
        },
        prices: [
          {
            currency_code: "usd",
            amount: 0,
          },
          {
            currency_code: "ars",
            amount: 0,
          },
          {
            region_id: region.id,
            amount: 0,
          },
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
      },
    ],
  });
  logger.info("Finished seeding fulfillment data.");

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel[0].id],
    },
  });
  logger.info("Finished seeding stock location data.");

  logger.info("Seeding publishable API key data...");
  const { result: publishableApiKeyResult } = await createApiKeysWorkflow(
    container
  ).run({
    input: {
      api_keys: [
        {
          title: "Webshop",
          type: "publishable",
          created_by: "",
        },
      ],
    },
  });

  const publishableApiKey = publishableApiKeyResult[0];
  savePublishableKey(publishableApiKey.token);

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel[0].id],
    },
  });
  logger.info("Finished seeding publishable API key data.");

  logger.info("Seeding product data...");

  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: Object.values(CATEGORIES).map((c) => ({
        name: c,
        is_active: true,
      })),
    },
  });

  await SeedProducts(
    container,
    categoryResult,
    shippingProfile.id,
    defaultSalesChannel[0].id
  );

  logger.info("Finished seeding product data.");

  logger.info("Seeding inventory levels.");

  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });

  const inventoryLevels: CreateInventoryLevelInput[] = [];
  for (const inventoryItem of inventoryItems) {
    const inventoryLevel = {
      location_id: stockLocation.id,
      stocked_quantity: 100,
      inventory_item_id: inventoryItem.id,
    };
    inventoryLevels.push(inventoryLevel);
  }

  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryLevels,
    },
  });

  logger.info("Seeding memberships.");

  await Promise.allSettled(
    membershipSeed.map((membership) =>
      createMembershipWorkflow(container).run({
        input: membership,
      })
    )
  );

  const customerModuleService = container.resolve(Modules.CUSTOMER);

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

  logger.info("Finished seeding inventory levels data.");
}
