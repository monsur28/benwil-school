import { getTranslations } from "next-intl/server"
import { CalendarClock, ClipboardCheck, Users, NotebookPen, GraduationCap, FileEdit } from "lucide-react"
import { requireAuth } from "@/lib/auth/dal"
import { getHomeworkList } from "@/lib/homework/get-homework"
import { StatCard } from "@/components/dashboard/stat-card"
import { QuickAction } from "@/components/dashboard/quick-action"
import { PortalHomeworkWidget } from "@/components/portal/portal-homework-widget"

export async function TeacherDashboard() {
  const [user, t, tCommon] = await Promise.all([
    requireAuth(),
    getTranslations("dashboard.teacher"),
    getTranslations("common"),
  ])

  const { homework } = await getHomeworkList({
    schoolId: user.schoolId,
    teacherId: user.userId,
    status: "PUBLISHED",
    take: 5,
  })

  const stats = [
    { icon: CalendarClock, label: t("todaysClasses") },
    { icon: Users, label: t("myStudents") },
    { icon: GraduationCap, label: t("upcomingExams") },
    { icon: FileEdit, label: t("pendingMarks") },
  ]

  const quickActions = [
    { href: "/attendance", icon: ClipboardCheck, label: t("takeAttendance") },
    { href: "/homework", icon: NotebookPen, label: t("homework") },
    { href: "/exams", icon: FileEdit, label: t("pendingMarks") },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} icon={stat.icon} label={stat.label} placeholder={tCommon("comingSoon")} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {quickActions.map((action) => (
          <QuickAction key={action.label} {...action} />
        ))}
      </div>
      <PortalHomeworkWidget homework={homework} viewAllHref="/homework" />
    </div>
  )
}
