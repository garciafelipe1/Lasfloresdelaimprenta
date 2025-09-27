import { Badge, Heading, Text } from "@medusajs/ui";
import { differenceInDays, format } from "date-fns";
import { SubscriptionType } from "../../../types";
import { formatARS } from "../../lib/utils";
import { SubscriptionBadge } from "../ui/subscription-badge";

interface Props {
  subscriptions: SubscriptionType[];
}

export function SubscriptionsList({ subscriptions }: Props) {
  return (
    <ul className="flex flex-col gap-2">
      {subscriptions.map((subscription) => (
        <li
          key={subscription.id}
          className="flex justify-between px-6 py-4 items-center"
        >
          <div className="flex flex-col gap-2">
            <Heading
              className="flex-row flex items-center divide-x gap-2"
              level="h3"
            >
              <Badge size="2xsmall">{subscription.membership_id}</Badge>
              <Text size="xsmall" className="text-ui-fg-subtle pl-2">
                {formatARS(subscription.price)}
              </Text>
              <Text size="xsmall" className="text-ui-fg-subtle pl-2">
                {subscription.id}
              </Text>
            </Heading>
            <Text size="small">
              Desde {format(subscription.started_at, "dd-MM-yyyy")}
            </Text>
            <Text size="small">
              Hasta {format(subscription.ended_at, "dd-MM-yyyy")}
            </Text>
            {subscription.status === "active" && (
              <Text size="small" className="text-ui-fg-subtle">
                {differenceInDays(
                  subscription.ended_at,
                  subscription.started_at
                )}{" "}
                Días restantes
              </Text>
            )}
          </div>
          <div>
            <SubscriptionBadge status={subscription.status} />
          </div>
        </li>
      ))}
    </ul>
  );
}
