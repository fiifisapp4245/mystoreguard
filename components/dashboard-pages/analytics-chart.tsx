"use client"

import { CartesianGrid, Line, LineChart, XAxis } from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const chartConfig: ChartConfig = {
  income: { label: "Income", color: "var(--color-primary)" },
  expenses: { label: "Expenses", color: "var(--color-destructive)" },
}

export default function AnalyticsChart({
  data,
}: {
  data: { period: string; income: number; expenses: number }[]
}) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
      <LineChart
        data={data}
        margin={{ left: 12, right: 12, top: 8, bottom: 0 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="period"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          padding={{ left: 16, right: 16 }}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          type="monotone"
          dataKey="income"
          stroke="var(--color-income)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="expenses"
          stroke="var(--color-expenses)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  )
}
