import { getLocale, getTranslations } from "next-intl/server"
import { CalendarCheck, Award, Printer, User, Megaphone, NotebookPen, Wallet } from "lucide-react"
import { requireStudentIdentity } from "@/lib/portal/identity"
import { getStudentAttendanceSummary } from "@/lib/attendance/get-attendance"
import { getStudentResultSummaries } from "@/lib/results/get-results"
import { getStudentFeeOverview } from "@/lib/fees/get-fees"
import { getVisibleNoticesForStudent } from "@/lib/notices/notice-visibility"
import { getVisibleHomeworkForStudent } from "@/lib/homework/homework-visibility"
import { StudentHero } from "@/components/portal/student-dashboard/student-hero"
import {
  StudentActionTiles,
  type StudentAction,
} from "@/components/portal/student-dashboard/student-action-tiles"
import { StudentAttendanceCard } from "@/components/portal/student-dashboard/student-attendance-card"
import { StudentResultCard } from "@/components/portal/student-dashboard/student-result-card"
import { StudentFeeCard } from "@/components/portal/student-dashboard/student-fee-card"
import { StudentHomeworkCard } from "@/components/portal/student-dashboard/student-homework-card"
import { StudentNoticesCard } from "@/components/portal/student-dashboard/student-notices-card"

/**
 * The student's home screen.
 *
 * Identity is resolved from the session only (requireStudentIdentity) and
 * every figure below comes from the same DAL helpers the rest of the portal
 * uses — attendance summary, finalised results, the student's own fee
 * overview, and class/section-visible notices and homework. Nothing on this
 * page is illustrative; empty data produces an empty state, never a number.
 *
 * Composition is built on a colour rhythm rather than a stack of white
 * cards: a blue hero, a multi-tint shortcut row, then a green/blue/semantic
 * academic row and an orange/blue feed row. White is reserved for the two
 * dense lists, which are the only content here that genuinely benefits from
 * maximum contrast.
 */
export default async function StudentDashboardPage() {
  const { user, student } = await requireStudentIdentity()
  const [t, locale] = await Promise.all([getTranslations("portal"), getLocale()])

  const [attendance, results, fees, notices, { homework }] = await Promise.all([
    getStudentAttendanceSummary({ studentId: student.id }),
    getStudentResultSummaries({
      schoolId: user.schoolId,
      studentId: student.id,
      classId: student.classId,
      finalizedOnly: true,
    }),
    getStudentFeeOverview({ schoolId: user.schoolId, studentId: student.id }),
    getVisibleNoticesForStudent({
      schoolId: user.schoolId,
      classId: student.classId,
      sectionId: student.sectionId,
      take: 4,
    }),
    getVisibleHomeworkForStudent({
      schoolId: user.schoolId,
      academicYearId: student.academicYearId,
      classId: student.classId,
      sectionId: student.sectionId,
      take: 4,
    }),
  ])

  const latestResult = results[0] ?? null
  const today = new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date())

  // Tints are assigned by meaning: green for attendance, blue for academic
  // records, orange for work that is pending, violet for money, neutral
  // yellow for the student's own profile.
  const actions: StudentAction[] = [
    {
      key: "attendance",
      href: "/portal/student/attendance",
      label: t("nav.attendance"),
      icon: CalendarCheck,
      tint: "green",
    },
    { key: "results", href: "/portal/student/results", label: t("nav.results"), icon: Award, tint: "blue" },
    {
      key: "report-card",
      href: latestResult
        ? `/portal/student/results/${latestResult.examId}/report-card`
        : "/portal/student/results",
      label: t("nav.reportCard"),
      icon: Printer,
      tint: "blue",
    },
    {
      key: "homework",
      href: "/portal/student/homework",
      label: t("nav.homework"),
      icon: NotebookPen,
      tint: "orange",
    },
    { key: "fees", href: "/portal/student/fees", label: t("nav.fees"), icon: Wallet, tint: "violet" },
    {
      key: "notices",
      href: "/portal/student/notices",
      label: t("nav.notices"),
      icon: Megaphone,
      tint: "blue",
    },
    { key: "profile", href: "/portal/student/profile", label: t("nav.profile"), icon: User, tint: "yellow" },
  ]

  return (
    <div className="space-y-6">
      <StudentHero
        greeting={t("welcome")}
        studentName={student.name}
        today={today}
        metaLine={`${student.class.name} ${student.section.name} • ${t("fields.roll")} ${student.roll} • ${student.academicYear.name}`}
      />

      <StudentActionTiles actions={actions} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StudentAttendanceCard
          percentage={attendance.percentage}
          counts={attendance.counts}
          href="/portal/student/attendance"
        />
        <StudentResultCard summary={latestResult} href="/portal/student/results" />
        <StudentFeeCard
          totalCharges={fees.summary.totalCharges}
          totalPaid={fees.summary.totalPaid}
          totalOutstanding={fees.summary.totalOutstanding}
          href="/portal/student/fees"
        />
      </div>

      {/* `items-start` on purpose: these two feeds rarely hold the same number
          of rows, and a tinted block stretched to match its neighbour reads as
          a large empty colour field. Letting each hug its content keeps the
          slack on the canvas, where it belongs. */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <StudentHomeworkCard homework={homework} basePath="/portal/student/homework" />
        <StudentNoticesCard notices={notices} basePath="/portal/student/notices" />
      </div>
    </div>
  )
}
