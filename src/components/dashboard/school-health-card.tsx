"use client"

import { useLocale, useTranslations } from "next-intl"
import { Panel, PanelHeader } from "@/components/shared/panel"
import { Badge } from "@/components/ui/badge"
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

/**
 * Four ratios that say whether the school is running well.
 *
 * Presented as a measured-bar list: the percentage sits at the end of each
 * label line and the bar underneath is thin and neutral — a reading, not a
 * decoration. Metrics that are illustrative rather than measured are marked
 * with an asterisk, as before.
 */
export function SchoolHealthCard({ metrics = DEFAULT_METRICS }: SchoolHealthCardProps) {
  const t = useTranslations("dashboard.admin.healthIndex")
  const locale = useLocale()

  const items = [
    { label: t("campusAttendance"), value: metrics.attendanceRate, status: t("optimal"), bar: "bg-success" },
    { label: t("feeCollectionPace"), value: metrics.feeCollectionRate, status: t("onTarget"), bar: "bg-dashboard-blue" },
    // No exam-completion tracking exists in the data model - illustrative
    // until that's built, marked as such rather than shown as real.
    { label: `${t("examResultPublication")} *`, value: metrics.examCompletionRate, status: t("finalized"), bar: "bg-dashboard-purple" },
    // Same for teacher-activity - no activity-tracking model exists yet.
    { label: `${t("facultyEngagement")} *`, value: metrics.teacherActivityRate, status: t("active"), bar: "bg-dashboard-orange" },
  ]

  const composite = Math.round((items.reduce((sum, item) => sum + item.value, 0) / items.length) * 10) / 10

  return (
    <Panel className="h-full">
      <PanelHeader
        title={t("title")}
        description={t("description")}
        action={<Badge variant="success">{t("nominal")}</Badge>}
      />

      <div className="flex-1 space-y-5 px-4 py-4 sm:px-5">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-[13px] font-medium text-foreground">{item.label}</span>
              <span className="shrink-0 text-[13px] font-semibold tabular-nums text-foreground">
                {formatNumber(item.value, locale)}%
              </span>
            </div>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${item.bar}`}
                style={{ width: `${Math.min(item.value, 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">{item.status}</p>
          </div>
        ))}
      </div>

      <div className="strip flex items-center justify-between gap-3 border-t border-border-light px-4 py-3 text-[11px] text-muted-foreground sm:px-5">
        <span>* {t("calculatedAt")}</span>
        <span className="font-semibold tabular-nums text-foreground">
          {locale === "bn" ? `যৌথ স্কোর: ${formatNumber(composite, locale)}/১০০` : `Composite: ${composite}/100`}
        </span>
      </div>
    </Panel>
  )
}
