import { InformationCircleSolid } from "@medusajs/icons";
import {
  createDataTableColumnHelper,
  IconButton,
  StatusBadge,
  Tooltip,
} from "@medusajs/ui";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { MemberDTO } from "../../../api/membership/members/route";

const columnHelper = createDataTableColumnHelper<MemberDTO>();

export const columns = [
  columnHelper.accessor("email", {
    header: "Email",
    enableSorting: true,
  }),
  columnHelper.accessor("startedAt", {
    header: "Fecha inicio",
    cell({ getValue }) {
      return <div>{format(getValue(), "dd-MM-yyyy")}</div>;
    },
  }),
  columnHelper.accessor("membershipId", {
    header: "Membresia",
  }),
  columnHelper.accessor("status", {
    header: "Estado",
    cell: ({ getValue }) => {
      const status = getValue();
      return (
        <StatusBadge color={status === "active" ? "green" : "grey"}>
          {status === "active" ? "Activo" : "Inactivo"}
        </StatusBadge>
      );
    },
  }),
  columnHelper.accessor("id", {
    header: "",
    cell: ({ getValue }) => {
      const id = getValue();

      return (
        <Tooltip
          delayDuration={300}
          content="Revisar el historial de subscripciones de este usuario"
        >
          <Link to={`/memberships/${id}`}>
            <IconButton>
              <InformationCircleSolid />
            </IconButton>
          </Link>
        </Tooltip>
      );
    },
  }),
];
