"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface BudgetChartProps {
  fixedExpenses: Array<{
    category: string
    amount: number
  }>
  allocations: Array<{
    category: string
    amount: number
    percent: number
  }>
  income: number
}

export function BudgetChart({ fixedExpenses, allocations, income }: BudgetChartProps) {
  // Combine fixed expenses and allocations for the chart
  const chartData = [
    ...fixedExpenses.map((expense) => ({
      name: expense.category,
      value: expense.amount,
      type: "Fixed Expense",
    })),
    ...allocations.map((allocation) => ({
      name: allocation.category,
      value: allocation.amount,
      type: "Goal/Allocation",
    })),
  ]

  // Colors for the chart
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
    "#F06292",
    "#4DD0E1",
    "#FFA726",
    "#BA68C8",
  ]

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percent = ((data.value / income) * 100).toFixed(1)

      return (
        <div className="bg-background border rounded-md shadow-sm p-2 text-sm">
          <p className="font-medium">{data.name}</p>
          <p className={cn("text-xs", data.type === "Fixed Expense" ? "text-destructive" : "text-primary")}>
            {data.type}
          </p>
          <p>
            ${data.value.toFixed(2)} ({percent}%)
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Budget Visualization</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {chartData.map((entry, index) => (
            <div key={`legend-${index}`} className="flex items-center text-sm">
              <div className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="truncate">{entry.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
