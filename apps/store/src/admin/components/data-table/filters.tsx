import { createDataTableFilterHelper } from "@medusajs/ui";
import { MemberDTO } from "@/api/membership/members/route";

const filterHelper = createDataTableFilterHelper<MemberDTO>();

export const filters = [
  filterHelper.accessor("status", {
    type: "select",
    label: "Status",
    options: [
      {
        label: "Activo",
        value: "active",
      },
      {
        label: "Inactivo",
        value: "Inactive",
      },
    ],
  }),
  filterHelper.accessor("membershipId", {
    type: "select",
    label: "Membresía",
    options: [
      {
        label: "Basico",
        value: "BASICA",
      },
      {
        label: "Mediana",
        value: "MEDIANA",
      },
      {
        label: "Premium",
        value: "PREMIUM",
      },
    ],
  }),
];
