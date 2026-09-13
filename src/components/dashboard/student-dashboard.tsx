import { getTranslations } from "next-intl/server"
import { CalendarClock, ClipboardCheck, NotebookPen, GraduationCap, Award, Megaphone } from "lucide-react"
import { StatCard } from "@/components/dashboard/stat-card"

export async function StudentDashboard() {
  const [t, tCommon] = await Promise.all([
    getTranslations("dashboard.student"),
    getTranslations("common"),
  ])

  const stats = [
    { icon: CalendarClock, label: t("todaysRoutine") },
    { icon: ClipboardCheck, label: t("attendance") },
    { icon: NotebookPen, label: t("homework") },
    { icon: GraduationCap, label: t("upcomingExam") },
    { icon: Award, label: t("latestResult") },
    { icon: Megaphone, label: t("notices") },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <StatCard key={stat.label} icon={stat.icon} label={stat.label} placeholder={tCommon("comingSoon")} />
      ))}
    </div>
  )
}
