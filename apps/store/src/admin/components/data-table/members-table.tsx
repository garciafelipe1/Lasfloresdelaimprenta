import {
  DataTable,
  DataTableFilteringState,
  Heading,
  useDataTable,
} from "@medusajs/ui";
import { useMemo, useState } from "react";
import { MemberDTO } from "../../../api/membership/members/route";
import { columns } from "./columns";
import { filters } from "./filters";

interface Props {
  data: MemberDTO[];
}

export function MembersTable({ data }: Props) {
  const [search, setSearch] = useState<string>("");
  const [filtering, setFiltering] = useState<DataTableFilteringState>({});

  const shownMembers = useMemo(() => {
    return data
      .filter((member) =>
        member.email.toLowerCase().includes(search.toLowerCase())
      )
      .filter((member) => {
        return Object.entries(filtering).every(([key, value]) => {
          if (!value) return true;
          // @ts-ignore
          console.log(member[key]);

          if (typeof value === "string") {
            // @ts-ignore
            return member[key]
              ?.toString()
              .toLowerCase()
              .includes(value.toLowerCase());
          }

          if (Array.isArray(value)) {
            // @ts-ignore
            const memberValue = member[key]?.toString().toUpperCase(); // Convert member's value to uppercase
            return value.includes(memberValue);
          }

          if (typeof value === "object") {
            // @ts-ignore
            const date = new Date(member[key]);
            // @ts-ignore
            if (value.$gte && date < new Date(value.$gte)) return false;
            // @ts-ignore
            if (value.$lte && date > new Date(value.$lte)) return false;
            // @ts-ignore
            if (value.$gt && date <= new Date(value.$gt)) return false;
            // @ts-ignore
            if (value.$lt && date >= new Date(value.$lt)) return false;
          }

          return true;
        });
      });
  }, [search, filtering]);

  const table = useDataTable({
    data: shownMembers,
    columns,
    getRowId: (product) => product.email,
    rowCount: data.length,
    isLoading: false,
    filters,
    filtering: {
      state: filtering,
      onFilteringChange: setFiltering,
    },
    search: {
      state: search,
      onSearchChange: setSearch,
    },
  });

  return (
    <DataTable instance={table}>
      <DataTable.Toolbar className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
        <Heading>Miembros</Heading>
        <div className="flex gap-2 items-center">
          <DataTable.Search placeholder="juanpereze@gmail.com" />
          <DataTable.FilterMenu />
        </div>
      </DataTable.Toolbar>
      <DataTable.Table
        emptyState={{
          empty: { description: "No hay miembros", heading: "NO HAY" },
          filtered: {
            description: "Ningun miembro cumple estos filtros",
            heading: "No hay miembros filtrados",
          },
        }}
      />
    </DataTable>
  );
}
