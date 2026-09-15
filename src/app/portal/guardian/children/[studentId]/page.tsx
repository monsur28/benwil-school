import { getTranslations } from "next-intl/server"
import { CalendarCheck, Award, Printer, User, Megaphone, NotebookPen } from "lucide-react"
import { requireGuardianIdentity, requireGuardianChild } from "@/lib/portal/identity"
import { getStudentAttendanceSummary } from "@/lib/attendance/get-attendance"
import { getStudentResultSummaries } from "@/lib/results/get-results"
import { getVisibleNoticesForGuardian } from "@/lib/notices/notice-visibility"
import { getVisibleHomeworkForStudent } from "@/lib/homework/homework-visibility"
import { AttendanceSummaryCard } from "@/components/portal/attendance-summary-card"
import { LatestResultCard } from "@/components/portal/latest-result-card"
import { PortalNoticesWidget } from "@/components/portal/portal-notices-widget"
import { PortalHomeworkWidget } from "@/components/portal/portal-homework-widget"
import { QuickActions, type QuickAction } from "@/components/portal/quick-actions"

export default async function GuardianChildDashboardPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { user, guardian, children } = await requireGuardianIdentity()
  const { studentId } = await params
  const student = await requireGuardianChild(guardian.id, studentId, user.schoolId)
  const t = await getTranslations("portal")

  const [attendance, results, notices, { homework }] = await Promise.all([
    getStudentAttendanceSummary({ studentId: student.id }),
    getStudentResultSummaries({
      schoolId: user.schoolId,
      studentId: student.id,
      classId: student.classId,
      finalizedOnly: true,
    }),
    // Guardian-wide, not just this child - a guardian's other children's
    // class/section notices are just as relevant here as on /portal/guardian/notices.
    getVisibleNoticesForGuardian({
      schoolId: user.schoolId,
      childClassIds: children.map((child) => child.classId),
      childSectionIds: children.map((child) => child.sectionId),
      take: 3,
    }),
    // Homework, unlike notices, is child-scoped (the route itself is
    // /portal/guardian/children/[studentId]/homework) - only this child's
    // own class/section homework, not a guardian-wide union.
    getVisibleHomeworkForStudent({
      schoolId: user.schoolId,
      academicYearId: student.academicYearId,
      classId: student.classId,
      sectionId: student.sectionId,
      take: 5,
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
    { key: "notices", href: "/portal/guardian/notices", label: t("nav.notices"), icon: Megaphone },
    { key: "homework", href: `${base}/homework`, label: t("nav.homework"), icon: NotebookPen },
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

      <PortalNoticesWidget notices={notices} viewAllHref="/portal/guardian/notices" />
      <PortalHomeworkWidget homework={homework} viewAllHref={`${base}/homework`} />

      <QuickActions actions={actions} />
    </div>
  )
}
