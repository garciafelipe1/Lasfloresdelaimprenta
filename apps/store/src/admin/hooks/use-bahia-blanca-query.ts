import { useQuery } from "@tanstack/react-query";
import { listShippingOptionsQuery } from "~/queries/bahia-blanca-queries";
import { BAHIA_BLANCA_SHIPPING_CODES } from "../../shared/constants";
import { shippingOptionsDto } from "../../shared/dtos/shipping-options";

export function useBahiaBlancaQuery() {
  const { data, isLoading } = useQuery(listShippingOptionsQuery);

  const bahiaBlancaCities =
    data?.shipping_options.filter(
      (shipping) =>
        shipping.type.code === BAHIA_BLANCA_SHIPPING_CODES.bahiaBlanca
    ) ?? [];

  const parsedCities = bahiaBlancaCities.map((city) => {
    const arsPrice = city.prices.find((p) => p.currency_code === "ars");

    return shippingOptionsDto.parse({
      id: city.id,
      name: city.name,
      price: arsPrice?.amount!,
      priceId: arsPrice?.id,
    });
  });

  return {
    bahiaBlancaCities: parsedCities,
    isLoading,
  };
}
