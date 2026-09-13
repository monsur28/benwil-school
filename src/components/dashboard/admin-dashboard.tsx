import { getTranslations } from "next-intl/server"
import {
  Users,
  GraduationCap,
  Briefcase,
  ClipboardCheck,
  Wallet,
  AlertCircle,
  CalendarClock,
  Megaphone,
  UserPlus,
  FileEdit,
  BadgeDollarSign,
} from "lucide-react"
import { StatCard } from "@/components/dashboard/stat-card"
import { QuickAction } from "@/components/dashboard/quick-action"

export async function AdminDashboard() {
  const [t, tCommon] = await Promise.all([
    getTranslations("dashboard.admin"),
    getTranslations("common"),
  ])

  const stats = [
    { icon: Users, label: t("students") },
    { icon: GraduationCap, label: t("teachers") },
    { icon: Briefcase, label: t("staff") },
    { icon: ClipboardCheck, label: t("todaysAttendance") },
    { icon: Wallet, label: t("todaysFeeCollection") },
    { icon: AlertCircle, label: t("pendingFees") },
    { icon: CalendarClock, label: t("upcomingExams") },
    { icon: Megaphone, label: t("recentNotices") },
  ]

  const quickActions = [
    { href: "/students", icon: UserPlus, label: t("addStudent") },
    { href: "/attendance", icon: ClipboardCheck, label: t("takeAttendance") },
    { href: "/exams", icon: CalendarClock, label: t("createExam") },
    { href: "/exams", icon: FileEdit, label: t("enterMarks") },
    { href: "/fees", icon: BadgeDollarSign, label: t("collectFee") },
    { href: "/notices", icon: Megaphone, label: t("createNotice") },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} icon={stat.icon} label={stat.label} placeholder={tCommon("comingSoon")} />
        ))}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">{t("quickActions")}</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {quickActions.map((action) => (
            <QuickAction key={action.label} {...action} />
          ))}
        </div>
      </div>
    </div>
  )
}
