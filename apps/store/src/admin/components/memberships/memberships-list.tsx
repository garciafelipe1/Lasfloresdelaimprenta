import { clx, Text } from "@medusajs/ui";
import { MembershipId } from "../../../shared/constants";
import { MembershipType } from "../../../shared/types";
import { formatARS } from "../../lib/utils";
import { EditMembershipDrawer } from "./edit-membership-drawer";

interface Props {
  data: MembershipType[];
}

export const membershipColors = {
  esencial: {
    bg: "rgb(241, 245, 249)",
    accent: "bg-slate-500",
  },
  premium: {
    bg: "#dbeafe",
    accent: "bg-blue-500",
  },
  elite: {
    bg: "rgb(243, 232, 255)",
    accent: "bg-purple-500",
  },
};

export function MembershipsList({ data }: Props) {
  return (
    <ul className="flex flex-col gap-2 p-1">
      {data?.map((membership) => (
        <li
          className="flex gap-4 justify-between rounded-xl items-center px-6 py-4 border overflow-hidden"
          key={membership.id}
        >
          <div className="flex gap-4 items-center">
            <div
              style={{
                backgroundColor:
                  membershipColors[membership.id as MembershipId].bg,
              }}
              className={clx("h-12 w-[3px] rounded-full")}
            />
            <div className="flex flex-col gap-2">
              <div className="flex divide-x gap-2">
                <Text size="xlarge" weight="plus">
                  {membership.name} | {membership.id}
                </Text>
                <Text size="xlarge" className="pl-2 text-ui-fg-subtle">
                  {formatARS(membership.price)}
                </Text>
              </div>
              <Text size="small" className="text-ui-fg-subtle">
                {membership.description}
              </Text>
            </div>
          </div>
          <EditMembershipDrawer {...membership} />
        </li>
      ))}
    </ul>
  );
}
