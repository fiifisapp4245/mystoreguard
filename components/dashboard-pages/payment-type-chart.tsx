"use client"

import { Cell, Pie, PieChart } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const chartConfig: ChartConfig = {
  Cash: { label: "Cash", color: "var(--color-chart-1)" },
  Momo: { label: "Momo", color: "var(--color-chart-2)" },
  Credit: { label: "Credit", color: "var(--color-chart-3)" },
  Deposit: { label: "Deposit", color: "var(--color-chart-4)" },
}

export default function PaymentTypeChart({
  data,
}: {
  data: { type: string; amount: number }[]
}) {
  return (
    <ChartContainer config={chartConfig} className="mx-auto h-48 w-48 shrink-0">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Pie data={data} dataKey="amount" nameKey="type" innerRadius={55} outerRadius={85} strokeWidth={4}>
          {data.map((entry) => (
            <Cell key={entry.type} fill={`var(--color-${entry.type})`} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
