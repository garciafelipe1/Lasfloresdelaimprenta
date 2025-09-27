import {
  createDataTableColumnHelper,
  DataTable,
  Heading,
  useDataTable,
} from "@medusajs/ui";
import { ShippingOptionsDTO } from "~/dtos/shipping-options";
import { formatARS } from "../../lib/utils";
import { CreateCityDrawer } from "./create-city-drawer";
import { UpdateCityModal } from "./update-city-modal";

const columnHelper = createDataTableColumnHelper<ShippingOptionsDTO>();

const columns = [
  columnHelper.accessor("name", {
    header: "Nombre",
    enableSorting: true,
  }),
  columnHelper.accessor("price", {
    header: "Precio",
    enableSorting: true,
    cell({ getValue }) {
      const price = getValue();
      return <p>{formatARS(price)}</p>;
    },
  }),
  columnHelper.accessor("id", {
    header: "Acciones",
    enableSorting: true,
    cell({ getValue, row }) {
      const id = getValue();
      const name = row.getValue("name") as string;
      const price = row.getValue("price") as number;
      const priceId = row.getValue("priceId") as string;

      return (
        <UpdateCityModal id={id} name={name} price={price} priceId={priceId} />
      );
    },
  }),
];

interface Props {
  data: ShippingOptionsDTO[];
}

export function BHTable({ data }: Props) {
  const table = useDataTable({
    columns,
    data: data,
    getRowId: (product) => product.id,
    rowCount: data.length,
    isLoading: false,
  });

  return (
    <DataTable instance={table}>
      <DataTable.Toolbar className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
        <Heading>Tasaciones envio ciudades de Bahía Blanca</Heading>
        <CreateCityDrawer />
      </DataTable.Toolbar>
      <DataTable.Table />
    </DataTable>
  );
}
