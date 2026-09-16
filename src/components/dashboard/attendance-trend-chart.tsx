"use client"

import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Panel, PanelHeader } from "@/components/shared/panel"
import { cn } from "cn"
import { formatNumber } from "@/lib/format"

export interface AttendanceDataPoint {
  day: string
  date: string
  present: number
  late: number
  absent: number
  rate: number
}

interface AttendanceTrendChartProps {
  initialData?: AttendanceDataPoint[]
}

const DEFAULT_7_DAYS: AttendanceDataPoint[] = [
  { day: "Mon", date: "Sep 08", present: 93.4, late: 3.2, absent: 3.4, rate: 93.4 },
  { day: "Tue", date: "Sep 09", present: 94.8, late: 2.8, absent: 2.4, rate: 94.8 },
  { day: "Wed", date: "Sep 10", present: 92.1, late: 4.1, absent: 3.8, rate: 92.1 },
  { day: "Thu", date: "Sep 11", present: 95.6, late: 2.2, absent: 2.2, rate: 95.6 },
  { day: "Fri", date: "Sep 12", present: 91.8, late: 4.5, absent: 3.7, rate: 91.8 },
  { day: "Sat", date: "Sep 13", present: 96.2, late: 1.8, absent: 2.0, rate: 96.2 },
  { day: "Sun", date: "Sep 14", present: 94.8, late: 2.5, absent: 2.7, rate: 94.8 },
]

const DEFAULT_30_DAYS: AttendanceDataPoint[] = [
  { day: "W1", date: "Aug 18-24", present: 92.5, late: 4.1, absent: 3.4, rate: 92.5 },
  { day: "W2", date: "Aug 25-31", present: 93.8, late: 3.5, absent: 2.7, rate: 93.8 },
  { day: "W3", date: "Sep 01-07", present: 94.2, late: 3.0, absent: 2.8, rate: 94.2 },
  { day: "W4", date: "Sep 08-14", present: 94.8, late: 2.5, absent: 2.7, rate: 94.8 },
]

const DEFAULT_TERM: AttendanceDataPoint[] = [
  { day: "Jul", date: "July 2026", present: 91.4, late: 4.8, absent: 3.8, rate: 91.4 },
  { day: "Aug", date: "August 2026", present: 93.2, late: 3.6, absent: 3.2, rate: 93.2 },
  { day: "Sep", date: "September 2026", present: 94.8, late: 2.6, absent: 2.6, rate: 94.8 },
]

export function AttendanceTrendChart({ initialData }: AttendanceTrendChartProps) {
  const t = useTranslations("dashboard.admin.attendanceChart")
  const locale = useLocale()
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "term">("7d")

  const chartData =
    timeRange === "7d"
      ? (initialData && initialData.length > 0 ? initialData : DEFAULT_7_DAYS)
      : timeRange === "30d"
        ? DEFAULT_30_DAYS
        : DEFAULT_TERM

  const ranges = [
    { id: "7d" as const, label: t("range7d") },
    { id: "30d" as const, label: t("range30d") },
    { id: "term" as const, label: t("rangeTerm") },
  ]

  return (
    <Panel className="h-full">
      <PanelHeader
        title={t("title")}
        description={t("description")}
        action={
          <div
            role="group"
            aria-label={t("title")}
            className="flex items-center gap-0.5 rounded-lg border border-border-light bg-muted p-0.5"
          >
            {ranges.map((range) => (
              <button
                key={range.id}
                type="button"
                aria-pressed={timeRange === range.id}
                onClick={() => setTimeRange(range.id)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                  timeRange === range.id
                    ? "bg-card font-semibold text-foreground shadow-card"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Legend — stated once, above the plot, so the series colours never
          need to be re-explained inside the chart. */}
      <div className="flex flex-wrap items-center gap-4 px-4 pt-4 text-xs sm:px-5">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded-full bg-dashboard-green" />
          <span className="font-medium text-foreground">{t("present")}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded-full bg-dashboard-yellow" />
          <span className="text-muted-foreground">{t("late")}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded-full bg-danger" />
          <span className="text-muted-foreground">{t("absent")}</span>
        </span>
      </div>

      <div className="h-60 w-full min-w-0 px-1 pb-4 pt-3 sm:px-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="presentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-dashboard-green)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--color-dashboard-green)" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="lateGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-dashboard-yellow)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--color-dashboard-yellow)" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "currentColor", fontSize: 11 }}
              className="text-muted-foreground"
            />
            <YAxis
              domain={[80, 100]}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "currentColor", fontSize: 11 }}
              className="text-muted-foreground"
              unit="%"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null
                const d = payload[0].payload as AttendanceDataPoint
                return (
                  <div className="rounded-xl border border-border bg-popover p-3 shadow-pop">
                    <p className="text-xs font-semibold text-foreground">{d.date}</p>
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex items-center justify-between gap-5 text-dashboard-green">
                        <span>{t("presentLabel")}</span>
                        <span className="font-semibold tabular-nums">{formatNumber(d.present, locale)}%</span>
                      </div>
                      <div className="flex items-center justify-between gap-5 text-dashboard-yellow">
                        <span>{t("lateLabel")}</span>
                        <span className="font-semibold tabular-nums">{formatNumber(d.late, locale)}%</span>
                      </div>
                      <div className="flex items-center justify-between gap-5 text-danger">
                        <span>{t("absentLabel")}</span>
                        <span className="font-semibold tabular-nums">{formatNumber(d.absent, locale)}%</span>
                      </div>
                    </div>
                  </div>
                )
              }}
            />
            <Area
              type="monotone"
              dataKey="present"
              stroke="var(--color-dashboard-green)"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#presentGradient)"
            />
            <Area
              type="monotone"
              dataKey="late"
              stroke="var(--color-dashboard-yellow)"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#lateGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  )
}
