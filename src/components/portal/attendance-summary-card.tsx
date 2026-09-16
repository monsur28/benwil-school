import { getTranslations } from "next-intl/server"
import type { AttendanceCounts } from "@/lib/attendance/get-attendance"
import { Panel, PanelHeader } from "@/components/shared/panel"

/**
 * Attendance at a glance: one headline percentage, then the four day counts
 * as a divided strip. The percentage is the answer; the counts are the
 * working, so they sit below it at a quarter of the size.
 */
export async function AttendanceSummaryCard({
  percentage,
  counts,
}: {
  percentage: number | null
  counts: AttendanceCounts
}) {
  const [t, tAttendance] = await Promise.all([
    getTranslations("portal"),
    getTranslations("attendance"),
  ])

  const breakdown = [
    { label: tAttendance("status.PRESENT"), value: counts.PRESENT, tone: "text-success" },
    { label: tAttendance("status.ABSENT"), value: counts.ABSENT, tone: "text-danger" },
    { label: tAttendance("status.LATE"), value: counts.LATE, tone: "text-warning" },
    { label: tAttendance("status.LEAVE"), value: counts.LEAVE, tone: "text-muted-foreground" },
  ]

  return (
    <Panel className="h-full">
      <PanelHeader title={t("cards.attendance")} />

      <div className="px-4 py-5 sm:px-5">
        <p className="metric text-[2.75rem] text-foreground">
          {percentage !== null ? `${percentage}%` : "—"}
        </p>
        <p className="mt-1.5 text-[13px] text-muted-foreground">{t("fields.attendancePercentage")}</p>
      </div>

      <div className="mt-auto grid grid-cols-2 divide-x divide-y divide-border-light border-t border-border-light sm:grid-cols-4 sm:divide-y-0">
        {breakdown.map((item) => (
          <div key={item.label} className="px-4 py-3">
            <span className="eyebrow block truncate">{item.label}</span>
            <span className={`mt-1 block text-base font-bold tabular-nums ${item.tone}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </Panel>
  )
}
