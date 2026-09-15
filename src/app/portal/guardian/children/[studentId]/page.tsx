import { getTranslations } from "next-intl/server"
import { CalendarCheck, Award, Printer, User } from "lucide-react"
import { requireGuardianIdentity, requireGuardianChild } from "@/lib/portal/identity"
import { getStudentAttendanceSummary } from "@/lib/attendance/get-attendance"
import { getStudentResultSummaries } from "@/lib/results/get-results"
import { AttendanceSummaryCard } from "@/components/portal/attendance-summary-card"
import { LatestResultCard } from "@/components/portal/latest-result-card"
import { QuickActions, type QuickAction } from "@/components/portal/quick-actions"

export default async function GuardianChildDashboardPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { user, guardian } = await requireGuardianIdentity()
  const { studentId } = await params
  const student = await requireGuardianChild(guardian.id, studentId, user.schoolId)
  const t = await getTranslations("portal")

  const [attendance, results] = await Promise.all([
    getStudentAttendanceSummary({ studentId: student.id }),
    getStudentResultSummaries({
      schoolId: user.schoolId,
      studentId: student.id,
      classId: student.classId,
      finalizedOnly: true,
    }),
  ])
  const latestResult = results[0] ?? null

  const base = `/portal/guardian/children/${studentId}`
  const actions: QuickAction[] = [
    { key: "attendance", href: `${base}/attendance`, label: t("nav.attendance"), icon: CalendarCheck },
    { key: "results", href: `${base}/results`, label: t("nav.results"), icon: Award },
    {
      key: "report-card",
      href: latestResult ? `${base}/results/${latestResult.examId}/report-card` : `${base}/results`,
      label: t("nav.reportCard"),
      icon: Printer,
    },
    { key: "profile", href: `${base}/profile`, label: t("nav.profile"), icon: User },
  ]

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-heading text-xl font-bold tracking-tight">{student.name}</h1>
        <p className="text-sm text-muted-foreground">
          {student.class.name} {student.section.name} • {t("fields.roll")} {student.roll} •{" "}
          {student.academicYear.name}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AttendanceSummaryCard percentage={attendance.percentage} counts={attendance.counts} />
        <LatestResultCard summary={latestResult} />
      </div>

      <QuickActions actions={actions} />
    </div>
  )
}
