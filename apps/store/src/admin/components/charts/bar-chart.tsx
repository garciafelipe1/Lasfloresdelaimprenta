"use client";

import { Text } from "@medusajs/ui";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";
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
import "../../index.css";

export const description = "A bar chart";

const chartConfig = {
  miembros: {
    label: "Miembros",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface Props {
  data: {
    membership: string;
    members: number;
  }[];
}

export function ChartBar({ data }: Props) {
  return (
    <Card className="bg-background">
      <CardHeader>
        <CardTitle>Miembros por Nivel de Membresía</CardTitle>
        <CardDescription className="text-ui-fg-subtle">
          Distribución actual de nuestros valiosos miembros.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="membership"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              wrapperStyle={{
                backgroundColor: "var(--bg-base)",
              }}
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar
              dataKey="members"
              style={{ fill: "var(--chart-1)" }}
              radius={8}
            >
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <Text size="small" className="text-ui-fg-subtle">
          ¡Cada miembro es importante para nosotros!
        </Text>
      </CardFooter>
    </Card>
  );
}
