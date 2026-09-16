import { getTranslations } from "next-intl/server"
import { CalendarClock, ClipboardCheck, Users, NotebookPen, GraduationCap, FileEdit } from "lucide-react"
import { requireAuth } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { getActiveAcademicYear } from "@/lib/academics/academic-year"
import { getHomeworkList } from "@/lib/homework/get-homework"
import { getPendingReviewCountForTeacher } from "@/lib/homework/get-homework-submissions"
import { StatCard } from "@/components/dashboard/stat-card"
import { QuickAction } from "@/components/dashboard/quick-action"
import { PortalHomeworkWidget } from "@/components/portal/portal-homework-widget"
import { Panel, PanelHeader } from "@/components/shared/panel"

export async function TeacherDashboard() {
  const [user, t, tCommon] = await Promise.all([
    requireAuth(),
    getTranslations("dashboard.teacher"),
    getTranslations("common"),
  ])

  const activeAcademicYear = await getActiveAcademicYear(user.schoolId)

  const [{ homework }, pendingReviewCount, assignments] = await Promise.all([
    getHomeworkList({
      schoolId: user.schoolId,
      teacherId: user.userId,
      status: "PUBLISHED",
      take: 5,
    }),
    getPendingReviewCountForTeacher({ schoolId: user.schoolId, teacherId: user.userId }),
    // "My Classes" is a current-operations view - only this year's
    // assignments (plus any legacy standing assignment predating
    // academic-year scoping, see teacher-assignments.ts), never a stale
    // assignment from a past year the school has since moved on from.
    prisma.teacherAssignment.findMany({
      where: {
        schoolId: user.schoolId,
        teacherId: user.userId,
        ...(activeAcademicYear && { OR: [{ academicYearId: activeAcademicYear.id }, { academicYearId: null }] }),
      },
      include: { class: true, section: true, subject: true },
      orderBy: [{ class: { order: "asc" } }, { section: { name: "asc" } }],
    }),
  ])

  // One card per class+section this teacher is assigned to (a teacher can
  // teach several subjects in the same section, so this collapses those
  // into one card listing all of them, rather than one card per subject).
  const classSections = new Map<
    string,
    { className: string; sectionName: string; sectionId: string; subjects: string[] }
  >()
  for (const assignment of assignments) {
    const key = `${assignment.classId}:${assignment.sectionId}`
    const existing = classSections.get(key)
    if (existing) {
      existing.subjects.push(assignment.subject.name)
    } else {
      classSections.set(key, {
        className: assignment.class.name,
        sectionName: assignment.section.name,
        sectionId: assignment.sectionId,
        subjects: [assignment.subject.name],
      })
    }
  }

  const studentCounts = await prisma.student.groupBy({
    by: ["sectionId"],
    where: { sectionId: { in: [...classSections.values()].map((c) => c.sectionId) }, status: "ACTIVE" },
    _count: true,
  })
  const studentCountBySection = new Map(studentCounts.map((row) => [row.sectionId, row._count]))
  const totalStudents = [...studentCountBySection.values()].reduce((sum, count) => sum + count, 0)

  const stats = [
    { icon: CalendarClock, label: t("todaysClasses") },
    { icon: Users, label: t("myStudents"), value: classSections.size > 0 ? totalStudents : undefined },
    { icon: GraduationCap, label: t("upcomingExams") },
    { icon: FileEdit, label: t("pendingMarks"), value: pendingReviewCount, description: t("pendingMarksCaption") },
  ]

  const quickActions = [
    { href: "/attendance", icon: ClipboardCheck, label: t("takeAttendance") },
    { href: "/homework", icon: NotebookPen, label: t("homework") },
    { href: "/exams", icon: FileEdit, label: t("pendingMarks") },
  ]

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            description={stat.description}
            placeholder={tCommon("comingSoon")}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {quickActions.map((action) => (
          <QuickAction key={action.label} {...action} />
        ))}
      </div>

      {classSections.size > 0 && (
        <Panel>
          <PanelHeader title={t("myClasses")} />
          {/* One entry per class+section, with the subjects taught there —
              the teacher's own slice of the timetable, not the school's. */}
          <div className="grid grid-cols-1 divide-y divide-border-light sm:grid-cols-2 sm:divide-x lg:grid-cols-3">
            {[...classSections.values()].map((cs) => (
              <div key={`${cs.className}-${cs.sectionName}`} className="px-4 py-4 sm:px-5">
                <p className="font-heading text-base font-bold tracking-[-0.015em] text-foreground">
                  {cs.className} {cs.sectionName}
                </p>
                <p className="mt-1 truncate text-[13px] text-muted-foreground">{cs.subjects.join(", ")}</p>
                <p className="mt-2 text-xs font-medium tabular-nums text-muted-foreground">
                  {t("students", { count: studentCountBySection.get(cs.sectionId) ?? 0 })}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <PortalHomeworkWidget homework={homework} viewAllHref="/homework" />
    </div>
  )
}
