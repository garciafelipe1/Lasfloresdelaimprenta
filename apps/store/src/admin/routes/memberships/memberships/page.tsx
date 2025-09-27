import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ChartBar as ChartBarMedusa, CurrencyDollar } from "@medusajs/icons";
import { Container, Heading } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { SubscriptionAnalytic } from "../../../../modules/membership/service";
import { MembershipType } from "../../../../types";
import { ChartBar } from "../../../components/charts/bar-chart";
import { ChartPie } from "../../../components/charts/pie-chart";
import { MembershipsList } from "../../../components/memberships/memberships-list";
import { medusaSdk } from "../../../lib/config";

const getMemberships = () => {
  return medusaSdk.client.fetch<MembershipType[]>("/membership", {
    method: "GET",
  });
};

const getSubscriptionsAnalytics = () => {
  return medusaSdk.client.fetch<SubscriptionAnalytic[]>(
    "/membership/subscription/analytics",
    {
      method: "GET",
    }
  );
};

const CustomPage = () => {
  const memberships = useQuery({
    queryFn: getMemberships,
    queryKey: ["memberships"],
  });

  const analytics = useQuery({
    queryFn: getSubscriptionsAnalytics,
    queryKey: ["analytics"],
  });

  const earningsChartData = analytics.data?.map((item, index) => ({
    membership: item.name,
    earns: item.total,
    fill: `var(--chart-${index + 1})`,
  }));

  const membersChartData = analytics.data?.map((item) => ({
    membership: item.name,
    members: item.count,
  }));

  return (
    <section className="flex flex-col gap-4">
      <Container className="divide-y p-0">
        <div className="flex items-center gap-2 px-6 py-4">
          <CurrencyDollar />
          <Heading level="h2">Membresías</Heading>
        </div>
        <MembershipsList data={memberships.data ?? []} />
      </Container>
      <Container className="divide-y p-0">
        <div className="flex items-center gap-2 px-6 py-4">
          <ChartBarMedusa />
          <Heading level="h2">Gráficos</Heading>
        </div>
        <section className="gap-2 p-2 grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))]">
          <ChartBar data={membersChartData ?? []} />
          <ChartPie data={earningsChartData ?? []} />
        </section>
      </Container>
    </section>
  );
};

export const config = defineRouteConfig({
  label: "Membresías",
});

export default CustomPage;
