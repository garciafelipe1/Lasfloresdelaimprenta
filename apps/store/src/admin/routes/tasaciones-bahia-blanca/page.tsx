import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Spinner, TruckFast } from "@medusajs/icons";
import { Container, Heading, Toaster } from "@medusajs/ui";
import { BHTable } from "~/components/bh-table/bh-table";
import { useBahiaBlancaQuery } from "~/hooks/use-bahia-blanca-query";

const CustomPage = () => {
  const { bahiaBlancaCities, isLoading } = useBahiaBlancaQuery();

  return (
    <>
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Ciudades Bahía Blanca</Heading>
        </div>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-4 p-4">
            <Spinner className="animate-spin" />
            Cargando...
          </div>
        ) : (
          <BHTable data={bahiaBlancaCities ?? []} />
        )}
      </Container>
      <Toaster />
    </>
  );
};

export const config = defineRouteConfig({
  label: "Ciudades Bahía Blanca",
  icon: TruckFast,
});

export default CustomPage;
