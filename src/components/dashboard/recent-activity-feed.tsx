"use client"

import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { UserPlus, Wallet, ClipboardCheck, CalendarClock, ArrowUpRight } from "lucide-react"
import { cn } from "cn"

export interface ActivityItem {
  id: string
  title: string
  description: string
  timestamp: string
  type: "admission" | "payment" | "attendance" | "exam"
  href?: string
}

interface RecentActivityFeedProps {
  activities?: ActivityItem[]
}

const ICON_MAP = {
  admission: {
    icon: UserPlus,
    color: "bg-dashboard-purple-light text-dashboard-purple",
  },
  payment: {
    icon: Wallet,
    color: "bg-dashboard-green-light text-dashboard-green",
  },
  attendance: {
    icon: ClipboardCheck,
    color: "bg-dashboard-blue-light text-dashboard-blue",
  },
  exam: {
    icon: CalendarClock,
    color: "bg-dashboard-orange-light text-dashboard-orange",
  },
}

export function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  const t = useTranslations("dashboard.admin.activity")
  const locale = useLocale()

  const defaultActivities: ActivityItem[] = [
    {
      id: "act-1",
      title: t("studentAdmitted"),
      description: "Sultana Parvin â€¢ Class 8 (A) â€¢ Roll #14",
      timestamp: t("minutesAgo", { count: locale === "bn" ? "à§®" : "8" }),
      type: "admission",
      href: "/students",
    },
    {
      id: "act-2",
      title: t("feeReceived"),
      description: "à§³ 12,500 collected â€¢ Student #STU-0821",
      timestamp: t("minutesAgo", { count: locale === "bn" ? "à§¨à§ª" : "24" }),
      type: "payment",
      href: "/fees",
    },
    {
      id: "act-3",
      title: t("attendanceDone"),
      description: t("attendanceSummary", {
        className: "Class 7 (B)",
        count: locale === "bn" ? "à§©à§¨" : "32",
        percent: locale === "bn" ? "à§¯à§­" : "97",
      }),
      timestamp: t("minutesAgo", { count: locale === "bn" ? "à§ªà§¨" : "42" }),
      type: "attendance",
      href: "/attendance",
    },
    {
      id: "act-4",
      title: t("examScheduled"),
      description: t("examRoutineFinalized"),
      timestamp: t("hourAgo", { count: locale === "bn" ? "à§§" : "1" }),
      type: "exam",
      href: "/exams",
    },
  ]

  const items = activities && activities.length > 0 ? activities : defaultActivities

  return (
    <Card className="flex flex-col justify-between rounded-xl border border-border/60 bg-card p-4 shadow-xs">
      <CardHeader className="p-0 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight text-foreground">
              {t("title")}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {t("description")}
            </CardDescription>
          </div>

          <Link
            href="/reports"
            className="group flex items-center gap-1 text-xs font-semibold text-brand-navy hover:underline"
          >
            <span>{t("auditLog")}</span>
            <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </CardHeader>

      <div className="space-y-3 pt-1">
        {items.map((item) => {
          const config = ICON_MAP[item.type] || ICON_MAP.admission
          const Icon = config.icon

          return (
            <div
              key={item.id}
              className="group flex items-start gap-3 rounded-xl p-2 transition-colors hover:bg-muted/40"
            >
              <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg mt-0.5", config.color)}>
                <Icon className="size-4" />
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-foreground">
                    {item.title}
                  </p>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                    {item.timestamp}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
        <span>{t("databaseStream")}</span>
        <span className="font-mono text-success">{t("liveConnected")}</span>
      </div>
    </Card>
  )
}
