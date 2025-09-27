"use client";

import { Text } from "@medusajs/ui";
import * as React from "react";
import { Label, Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../../components/ui/chart";
import { formatARS } from "../../lib/utils";

export const description = "A donut chart with text";

const chartConfig = {
  earns: {
    label: "Ganancias",
  },
  Esencial: {
    label: "Esencial",
    color: "var(--chart-1)",
  },
  Premium: {
    label: "Premium",
    color: "var(--chart-2)",
  },
  Elite: {
    label: "Elite",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

interface Props {
  data: {
    membership: string;
    earns: number;
    fill: string;
  }[];
}

export function ChartPie({ data }: Props) {
  const totalEarnings = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.earns, 0);
  }, [data]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Ingresos por Nivel de Membresía</CardTitle>
        <CardDescription className="text-ui-fg-subtle">
          Descubre cómo contribuye cada membresía a tus ingresos totales.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              wrapperStyle={{
                backgroundColor: "var(--bg-base)",
              }}
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={data}
              dataKey="earns"
              nameKey="membership"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          style={{ fill: `var(--fg-base)` }}
                          className="text-xl font-bold"
                        >
                          {formatARS(totalEarnings)}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          style={{ fill: `var(--fg-base)` }}
                          className="text-xs"
                        >
                          Ingresos
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <Text size="small" className="text-ui-fg-subtle">
          ¡Una forma clara de ver tu éxito!
        </Text>
      </CardFooter>
    </Card>
  );
}
