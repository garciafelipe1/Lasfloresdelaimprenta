import { SubscriptionType } from "@/shared/types";
import { MedusaService } from "@medusajs/framework/utils";
import Membership from "./models/membership";
import Subscription from "./models/subscription";

export type SubscriptionAnalytic = {
  name: string;
  total: number;
  count: number;
};

class MembershipModuleService extends MedusaService({
  Membership,
  Subscription,
}) {
  async getAnalytics(): Promise<SubscriptionAnalytic[]> {
    const memberships = await this.listMemberships();

    const data: SubscriptionType[] = await this.listSubscriptions();

    // Initialize with defaults
    const earningsMap: Record<string, SubscriptionAnalytic> = {};
    for (const { id } of memberships) {
      earningsMap[id] = {
        name: id,
        total: 0,
        count: 0,
      };
    }

    for (const sub of data) {
      const membershipId = sub.membership.id;
      const price = sub.price;

      if (!earningsMap[membershipId]) {
        earningsMap[membershipId] = {
          name: membershipId,
          total: 0,
          count: 0,
        };
      }

      if (sub.status === "active") {
        earningsMap[membershipId].total += price;
      }

      earningsMap[membershipId].count += 1;
    }

    return Object.values(earningsMap).map((item) => ({
      count: item.count,
      name: item.name,
      total: item.total,
    }));
  }
}

export default MembershipModuleService;
