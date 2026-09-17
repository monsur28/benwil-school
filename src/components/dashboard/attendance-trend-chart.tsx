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
import { Activity, CalendarOff, TrendingDown, TrendingUp } from "lucide-react"
import { Panel, PanelHeader } from "@/components/shared/panel"
import { cn } from "cn"
import { formatNumber } from "@/lib/format"
import { IconBadge } from "@/components/ui/icon-badge"

export interface AttendanceDataPoint {
  /** Short axis label — a weekday, a week range, or a month. */
  day: string
  /** Full label for the tooltip. */
  date: string
  present: number
  late: number
  absent: number
}

export interface AttendanceTodaySummary {
  rate: number
  present: number
  late: number
  absent: number
}

interface AttendanceTrendChartProps {
  series: {
    sevenDay: AttendanceDataPoint[]
    thirtyDay: AttendanceDataPoint[]
    term: AttendanceDataPoint[]
  }
  /** Null until someone takes today's register. */
  today: AttendanceTodaySummary | null
  /** Percentage points against the previous recorded day, with that day's
      label. Null when there is no earlier register to compare against. */
  delta: { points: number; sinceLabel: string } | null
}

/**
 * Attendance, answering one question: is attendance healthy?
 *
 * The headline rate comes first because that is the answer; the split and the
 * chart below it are the evidence. Every series is read from the register —
 * there is no sample data behind any range, so a range with no history says
 * so instead of drawing a plausible line.
 */
export function AttendanceTrendChart({ series, today, delta }: AttendanceTrendChartProps) {
  const t = useTranslations("dashboard.admin.attendanceChart")
  const locale = useLocale()
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "term">("7d")

  const chartData =
    timeRange === "7d" ? series.sevenDay : timeRange === "30d" ? series.thirtyDay : series.term

  const ranges = [
    { id: "7d" as const, label: t("range7d") },
    { id: "30d" as const, label: t("range30d") },
    { id: "term" as const, label: t("rangeTerm") },
  ]

  // One vocabulary for the series, used twice: as today's split when the
  // register is in, and as the chart's legend either way. The legend must not
  // depend on today's data — the lines still need naming on a day nobody has
  // taken the register yet.
  const legend = [
    { key: "present", label: t("present"), value: today?.present, dot: "bg-dashboard-green", text: "text-success" },
    { key: "late", label: t("late"), value: today?.late, dot: "bg-dashboard-yellow", text: "text-warning" },
    { key: "absent", label: t("absent"), value: today?.absent, dot: "bg-danger", text: "text-danger" },
  ]

  return (
    <Panel className="h-full">
      <PanelHeader
        title={t("title")}
        description={t("description")}
        icon={<Activity />}
        iconTone="green"
        stack
        action={
          <div
            role="group"
            aria-label={t("rangeLabel")}
            className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border-light bg-muted p-0.5"
          >
            {ranges.map((range) => (
              <button
                key={range.id}
                type="button"
                aria-pressed={timeRange === range.id}
                onClick={() => setTimeRange(range.id)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                  // The selected period takes the brand fill, so which window is
                  // on screen is legible at a glance rather than by a one-step
                  // shade difference.
                  timeRange === range.id
                    ? "bg-primary font-semibold text-primary-foreground shadow-card"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
        }
      />

      {/* The answer, before the evidence. */}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-4 pt-4 sm:px-5">
        <div className="min-w-0">
          <p className="eyebrow">{t("todayLabel")}</p>
          {today ? (
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="metric text-[1.75rem] text-success">
                {formatNumber(today.rate, locale)}%
              </span>
              {delta && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-medium",
                    delta.points >= 0 ? "text-success" : "text-danger"
                  )}
                >
                  {delta.points >= 0 ? (
                    <TrendingUp className="size-3.5" />
                  ) : (
                    <TrendingDown className="size-3.5" />
                  )}
                  {t("pointsSince", {
                    points: `${delta.points >= 0 ? "+" : "−"}${formatNumber(Math.abs(delta.points), locale)}`,
                    day: delta.sinceLabel,
                  })}
                </span>
              )}
            </div>
          ) : (
            <p className="metric mt-1 text-[1.75rem] text-warning">{t("notTakenYet")}</p>
          )}
        </div>

        <dl className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {legend.map((row) => (
            <div key={row.key} className="flex items-center gap-1.5">
              <span aria-hidden="true" className={cn("size-1.5 rounded-full", row.dot)} />
              <dt className="text-xs text-muted-foreground">{row.label}</dt>
              {row.value !== undefined && (
                <dd className={cn("text-xs font-semibold tabular-nums", row.text)}>
                  {formatNumber(row.value, locale)}%
                </dd>
              )}
            </div>
          ))}
        </dl>
      </div>

      {/* A line needs two points to be a line. One register, or none, gets an
          honest note rather than a chart drawn out of nothing. */}
      {chartData.length < 2 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
          <IconBadge icon={CalendarOff} tone="muted" size="md" />
          <p className="text-[13px] font-medium text-foreground">{t("noTrendTitle")}</p>
          <p className="max-w-xs text-xs text-muted-foreground">{t("noTrendDetail")}</p>
        </div>
      ) : (
        <div className="h-52 w-full min-w-0 px-1 pb-4 pt-4 sm:px-2">
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
                domain={[0, 100]}
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
                        <div className="flex items-center justify-between gap-5 text-success">
                          <span>{t("presentLabel")}</span>
                          <span className="font-semibold tabular-nums">{formatNumber(d.present, locale)}%</span>
                        </div>
                        <div className="flex items-center justify-between gap-5 text-warning">
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
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="late"
                stroke="var(--color-dashboard-yellow)"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#lateGradient)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  )
}
