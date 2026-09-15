import { getTranslations } from "next-intl/server"
import { CalendarCheck, Award, Printer, User, Wallet } from "lucide-react"
import { requireStudentIdentity } from "@/lib/portal/identity"
import { getStudentAttendanceSummary } from "@/lib/attendance/get-attendance"
import { getStudentResultSummaries } from "@/lib/results/get-results"
import { AttendanceSummaryCard } from "@/components/portal/attendance-summary-card"
import { LatestResultCard } from "@/components/portal/latest-result-card"
import { QuickActions, type QuickAction } from "@/components/portal/quick-actions"

export default async function StudentDashboardPage() {
  const { user, student } = await requireStudentIdentity()
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

  const actions: QuickAction[] = [
    { key: "attendance", href: "/portal/student/attendance", label: t("nav.attendance"), icon: CalendarCheck },
    { key: "results", href: "/portal/student/results", label: t("nav.results"), icon: Award },
    {
      key: "report-card",
      href: latestResult ? `/portal/student/results/${latestResult.examId}/report-card` : "/portal/student/results",
      label: t("nav.reportCard"),
      icon: Printer,
    },
    { key: "profile", href: "/portal/student/profile", label: t("nav.profile"), icon: User },
    { key: "fees", href: "/portal/student/fees", label: t("nav.fees"), icon: Wallet },
  ]

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-heading text-xl font-bold tracking-tight">
          {t("welcome")}, {student.name}
        </h1>
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
