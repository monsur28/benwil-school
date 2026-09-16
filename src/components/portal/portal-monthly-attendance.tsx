"use client"

import { Card } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Pie, PieChart, Cell } from "recharts"

interface PortalMonthlyAttendanceProps {
  present: number
  absent: number
  late: number
}

export function PortalMonthlyAttendance({
  present = 22,
  absent = 2,
  late = 1,
}: PortalMonthlyAttendanceProps) {
  const total = present + absent + late
  const percentage = total === 0 ? 0 : Math.round((present / total) * 100)

  const data = [
    { name: "Present", value: present, color: "var(--color-present)" },
    { name: "Absent", value: absent, color: "var(--color-absent)" },
    { name: "Late", value: late, color: "var(--color-late)" },
  ]

  const chartConfig = {
    present: { label: "Present", color: "var(--success)" },
    absent: { label: "Absent", color: "var(--destructive)" },
    late: { label: "Late", color: "var(--warning)" },
  }

  return (
    <Card className="p-6 flex flex-col h-full bg-card border-border">
      <h3 className="text-lg font-bold text-foreground mb-4">Monthly Attendance</h3>
      
      <div className="flex-1 flex items-center justify-between">
        <div className="relative w-32 h-32 flex-shrink-0">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={45}
                outerRadius={60}
                strokeWidth={0}
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
            <span className="text-2xl font-bold text-foreground leading-none">{percentage}%</span>
          </div>
        </div>

        <div className="space-y-3 ml-4 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-sm font-medium text-muted-foreground">Present</span>
            </div>
            <span className="text-sm font-bold text-foreground">{present}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span className="text-sm font-medium text-muted-foreground">Absent</span>
            </div>
            <span className="text-sm font-bold text-foreground">{absent}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-warning" />
              <span className="text-sm font-medium text-muted-foreground">Late</span>
            </div>
            <span className="text-sm font-bold text-foreground">{late}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
