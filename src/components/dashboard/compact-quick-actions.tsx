"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { UserPlus, ClipboardCheck, CalendarClock, Wallet, Megaphone, ArrowRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "cn"

export function CompactQuickActions() {
  const t = useTranslations("dashboard.admin.quickActions")

  const actions = [
    {
      href: "/students/new",
      label: t("addStudent"),
      description: t("addStudentDesc"),
      icon: UserPlus,
      colorClass: "bg-dashboard-purple-light text-dashboard-purple group-hover:bg-dashboard-purple group-hover:text-white",
      borderHover: "hover:border-dashboard-purple/30",
    },
    {
      href: "/attendance",
      label: t("takeAttendance"),
      description: t("takeAttendanceDesc"),
      icon: ClipboardCheck,
      colorClass: "bg-dashboard-blue-light text-dashboard-blue group-hover:bg-dashboard-blue group-hover:text-white",
      borderHover: "hover:border-dashboard-blue/30",
    },
    {
      href: "/exams",
      label: t("createExam"),
      description: t("createExamDesc"),
      icon: CalendarClock,
      colorClass: "bg-dashboard-orange-light text-dashboard-orange group-hover:bg-dashboard-orange group-hover:text-white",
      borderHover: "hover:border-dashboard-orange/30",
    },
    {
      href: "/fees",
      label: t("collectFee"),
      description: t("collectFeeDesc"),
      icon: Wallet,
      colorClass: "bg-dashboard-green-light text-dashboard-green group-hover:bg-dashboard-green group-hover:text-white",
      borderHover: "hover:border-dashboard-green/30",
    },
    {
      href: "/notices",
      label: t("createNotice"),
      description: t("createNoticeDesc"),
      icon: Megaphone,
      colorClass: "bg-dashboard-pink-light text-dashboard-pink group-hover:bg-dashboard-pink group-hover:text-white",
      borderHover: "hover:border-dashboard-pink/30",
    },
  ]

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          {t("title")}
        </h2>
        <span className="text-xs text-muted-foreground">{t("subtitle")}</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group block rounded-xl focus:outline-none"
          >
            <Card
              className={cn(
                "flex h-full flex-col justify-between rounded-xl border border-border/60 bg-card p-3 transition-all duration-150 hover:shadow-xs",
                action.borderHover
              )}
            >
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-lg transition-colors duration-150",
                    action.colorClass
                  )}
                >
                  <action.icon className="size-3.5" />
                </div>
                <ArrowRight className="size-3 text-muted-foreground/40 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>

              <div className="mt-3">
                <p className="text-xs font-semibold tracking-tight text-foreground">
                  {action.label}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {action.description}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
