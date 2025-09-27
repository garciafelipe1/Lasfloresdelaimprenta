import { queryOptions } from "@tanstack/react-query";
import {
  CreateShippingOptionsDTO,
  ShippingOptionsDTO,
} from "~/dtos/shipping-options";
import { medusaSdk } from "~/lib/config";

export const QUERY_KEYS = {
  LIST_ALL: ["shipping-options"],
};

export const listShippingOptionsQuery = queryOptions({
  queryFn: () => medusaSdk.admin.shippingOption.list(),
  queryKey: QUERY_KEYS.LIST_ALL,
});

export const createCity = async (payload: CreateShippingOptionsDTO) => {
  return medusaSdk.client.fetch("/bahia-blanca/city", {
    method: "POST",
    body: payload,
  });
};

export const updateCity = (input: ShippingOptionsDTO) => {
  const { id, name, price, priceId } = input;

  return medusaSdk.admin.shippingOption.update(id, {
    name,
    prices: [
      {
        id: priceId,
        amount: price,
        currency_code: "ars",
      },
    ],
  });
};
