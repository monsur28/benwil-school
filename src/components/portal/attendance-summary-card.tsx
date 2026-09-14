import { getTranslations } from "next-intl/server"
import type { AttendanceCounts } from "@/lib/attendance/get-attendance"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("cards.attendance")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-6">
        <div>
          <p className="text-3xl font-semibold tracking-tight">{percentage !== null ? `${percentage}%` : "—"}</p>
          <p className="text-sm text-muted-foreground">{t("fields.attendancePercentage")}</p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <span>
            <span className="text-muted-foreground">{tAttendance("status.PRESENT")}: </span>
            <span className="font-semibold">{counts.PRESENT}</span>
          </span>
          <span>
            <span className="text-muted-foreground">{tAttendance("status.ABSENT")}: </span>
            <span className="font-semibold">{counts.ABSENT}</span>
          </span>
          <span>
            <span className="text-muted-foreground">{tAttendance("status.LATE")}: </span>
            <span className="font-semibold">{counts.LATE}</span>
          </span>
          <span>
            <span className="text-muted-foreground">{tAttendance("status.LEAVE")}: </span>
            <span className="font-semibold">{counts.LEAVE}</span>
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
