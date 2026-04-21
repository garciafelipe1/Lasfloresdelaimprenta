import { queryOptions } from "@tanstack/react-query";
import { medusaSdk } from "@/admin/lib/config";
import {
  CreateShippingOptionsDTO,
  ShippingOptionsDTO,
} from "@/shared/dtos/shipping-options";

/** Respuesta mínima del SDK admin para listar opciones de envío. */
export interface AdminShippingOptionListResponse {
  shipping_options: Array<{
    id: string;
    name: string;
    type: { code: string };
    prices: Array<{ id?: string; amount: number; currency_code: string }>;
  }>;
}

export const QUERY_KEYS = {
  LIST_ALL: ["shipping-options"],
};

export const listShippingOptionsQuery = queryOptions({
  queryFn: async () => {
    const res = await medusaSdk.admin.shippingOption.list();
    return res as AdminShippingOptionListResponse;
  },
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
