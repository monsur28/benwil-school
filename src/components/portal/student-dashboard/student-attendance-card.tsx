import { getTranslations } from "next-intl/server"
import { CalendarCheck } from "lucide-react"
import type { AttendanceCounts } from "@/lib/attendance/get-attendance"
import { TintedPanel, TintedPanelHeader } from "@/components/shared/tinted-panel"

/**
 * Attendance, on the student dashboard.
 *
 * Green because attendance is the "am I on track" metric — the tint is the
 * answer before the number is read. The four day counts sit on white chips
 * inside the green field so they stay dense and legible without the section
 * losing its colour identity.
 *
 * A student with no attendance recorded yet sees an em dash and a plain
 * caption, never a fabricated percentage.
 */
export async function StudentAttendanceCard({
  percentage,
  counts,
  href,
}: {
  percentage: number | null
  counts: AttendanceCounts
  href: string
}) {
  const [t, tAttendance] = await Promise.all([
    getTranslations("portal"),
    getTranslations("attendance"),
  ])

  const breakdown = [
    { label: tAttendance("status.PRESENT"), value: counts.PRESENT },
    { label: tAttendance("status.ABSENT"), value: counts.ABSENT },
    { label: tAttendance("status.LATE"), value: counts.LATE },
    { label: tAttendance("status.LEAVE"), value: counts.LEAVE },
  ]

  return (
    <TintedPanel tint="green" className="h-full">
      <TintedPanelHeader
        tint="green"
        title={t("cards.attendance")}
        icon={<CalendarCheck />}
        href={href}
        hrefLabel={t("nav.attendance")}
      />

      <div className="flex flex-1 flex-col justify-between px-5 pb-5">
        <div>
          <p className="metric text-[3.25rem] text-surface-green-foreground">
            {percentage !== null ? `${percentage}%` : "—"}
          </p>
          <p className="mt-1 text-[13px] font-medium text-surface-green-foreground/80">
            {t("fields.attendancePercentage")}
          </p>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-2">
          {breakdown.map((item) => (
            <div
              key={item.label}
              className="flex items-baseline justify-between gap-2 rounded-xl bg-card/70 px-3 py-2"
            >
              <dt className="min-w-0 truncate text-[11px] font-semibold text-surface-green-foreground/75">
                {item.label}
              </dt>
              <dd className="shrink-0 text-sm font-bold tabular-nums text-surface-green-foreground">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </TintedPanel>
  )
}
