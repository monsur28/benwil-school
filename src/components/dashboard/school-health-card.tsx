"use client"

import { useLocale, useTranslations } from "next-intl"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Activity } from "lucide-react"
import { formatNumber } from "@/lib/format"

export interface SchoolHealthMetrics {
  attendanceRate: number
  feeCollectionRate: number
  examCompletionRate: number
  teacherActivityRate: number
}

interface SchoolHealthCardProps {
  metrics?: SchoolHealthMetrics
}

const DEFAULT_METRICS: SchoolHealthMetrics = {
  attendanceRate: 94.8,
  feeCollectionRate: 82.4,
  examCompletionRate: 87.0,
  teacherActivityRate: 98.0,
}

export function SchoolHealthCard({ metrics = DEFAULT_METRICS }: SchoolHealthCardProps) {
  const t = useTranslations("dashboard.admin.healthIndex")
  const locale = useLocale()

  const items = [
    {
      label: t("campusAttendance"),
      value: metrics.attendanceRate,
      status: t("optimal"),
      barColor: "bg-dashboard-green",
      textColor: "text-dashboard-green",
    },
    {
      label: t("feeCollectionPace"),
      value: metrics.feeCollectionRate,
      status: t("onTarget"),
      barColor: "bg-dashboard-blue",
      textColor: "text-dashboard-blue",
    },
    {
      // No exam-completion tracking exists in the data model - illustrative
      // until that's built, marked as such rather than shown as real.
      label: `${t("examResultPublication")} *`,
      value: metrics.examCompletionRate,
      status: t("finalized"),
      barColor: "bg-dashboard-purple",
      textColor: "text-dashboard-purple",
    },
    {
      // Same for teacher-activity - no activity-tracking model exists yet.
      label: `${t("facultyEngagement")} *`,
      value: metrics.teacherActivityRate,
      status: t("active"),
      barColor: "bg-dashboard-orange",
      textColor: "text-dashboard-orange",
    },
  ]

  const composite = Math.round((items.reduce((sum, item) => sum + item.value, 0) / items.length) * 10) / 10

  return (
    <Card className="flex flex-col justify-between rounded-xl border border-border/60 bg-card p-4 shadow-xs">
      <CardHeader className="p-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-dashboard-green-light text-dashboard-green">
              <Activity className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold tracking-tight text-foreground">
                {t("title")}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {t("description")}
              </CardDescription>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full border border-dashboard-green/20 bg-dashboard-green-light px-2 py-0.5 text-[10px] font-semibold text-dashboard-green uppercase">
            {t("nominal")}
          </span>
        </div>
      </CardHeader>

      <div className="space-y-3 pt-1">
        {items.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">
                {item.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">{item.status}</span>
                <span className={`font-mono font-bold ${item.textColor}`}>
                  {formatNumber(item.value, locale)}%
                </span>
              </div>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
              <div
                className={`h-full rounded-full ${item.barColor} transition-all duration-500`}
                style={{ width: `${Math.min(item.value, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
        <span>* {t("calculatedAt")}</span>
        <span className="font-mono font-medium text-foreground">
          {locale === "bn" ? `à¦¯à§Œà¦¥ à¦¸à§à¦•à§‹à¦°: ${formatNumber(composite, locale)}/à§§à§¦à§¦` : `Composite: ${composite}/100`}
        </span>
      </div>
    </Card>
  )
}
