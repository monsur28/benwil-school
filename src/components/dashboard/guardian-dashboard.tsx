import { getTranslations } from "next-intl/server"
import { Users, ClipboardCheck, Wallet, GraduationCap, NotebookPen, CalendarClock, Megaphone } from "lucide-react"
import { StatCard } from "@/components/dashboard/stat-card"

export async function GuardianDashboard() {
  const [t, tCommon] = await Promise.all([
    getTranslations("dashboard.guardian"),
    getTranslations("common"),
  ])

  const stats = [
    { icon: Users, label: t("myChildren") },
    { icon: ClipboardCheck, label: t("attendance") },
    { icon: Wallet, label: t("fees") },
    { icon: GraduationCap, label: t("results") },
    { icon: NotebookPen, label: t("homework") },
    { icon: CalendarClock, label: t("routine") },
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
