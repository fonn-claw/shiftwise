"use client"

import { format } from "date-fns"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface BudgetChartProps {
  dailyCosts: Record<string, number>
  weeklyBudget: number
  weekDays: Date[]
}

const chartConfig = {
  actual: {
    label: "Actual",
    color: "hsl(var(--chart-1))",
  },
  budget: {
    label: "Budget",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function BudgetChart({
  dailyCosts,
  weeklyBudget,
  weekDays,
}: BudgetChartProps) {
  const dailyBudget = weeklyBudget / 7

  const data = weekDays.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd")
    return {
      day: format(day, "EEE"),
      actual: Math.round(dailyCosts[dateStr] || 0),
      budget: Math.round(dailyBudget),
    }
  })

  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          fontSize={12}
        />
        <YAxis tickLine={false} axisLine={false} fontSize={12} width={45} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          dataKey="budget"
          fill="var(--color-budget)"
          radius={[4, 4, 0, 0]}
          opacity={0.3}
        />
        <Bar
          dataKey="actual"
          fill="var(--color-actual)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  )
}
