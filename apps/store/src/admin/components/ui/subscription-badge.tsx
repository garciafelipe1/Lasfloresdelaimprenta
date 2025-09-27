import { StatusBadge } from "@medusajs/ui";
import { SubscriptionType } from "../../../types";

interface Props {
  status: SubscriptionType["status"];
}

export function SubscriptionBadge({ status }: Props) {
  switch (status) {
    case "active":
      return <StatusBadge color="green">Activa</StatusBadge>;
    case "pending":
      return <StatusBadge color="orange">Pendiente</StatusBadge>;
    case "cancelled":
      return <StatusBadge color="red">Cancelada</StatusBadge>;
    default:
      return <StatusBadge color="grey">Inactiva</StatusBadge>;
  }
}
