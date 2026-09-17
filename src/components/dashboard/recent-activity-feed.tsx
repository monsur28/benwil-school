"use client"

import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { UserPlus, Wallet, ClipboardCheck, CalendarClock } from "lucide-react"
import { cn } from "cn"
import { Panel, PanelHeader } from "@/components/shared/panel"

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
  admission: { icon: UserPlus, tone: "text-dashboard-purple" },
  payment: { icon: Wallet, tone: "text-success" },
  attendance: { icon: ClipboardCheck, tone: "text-dashboard-blue" },
  exam: { icon: CalendarClock, tone: "text-dashboard-orange" },
}

/**
 * What has happened in the school today.
 *
 * A true timeline — a single connector line running through small icon nodes
 * — rather than a list of tinted squares. The line is what makes this read as
 * chronology at a glance and distinguishes it from the notice list beside it.
 */
export function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  const t = useTranslations("dashboard.admin.activity")
  const locale = useLocale()

  const defaultActivities: ActivityItem[] = [
    {
      id: "act-1",
      title: t("studentAdmitted"),
      description: "Sultana Parvin · Class 8 (A) · Roll #14",
      timestamp: t("minutesAgo", { count: locale === "bn" ? "৮" : "8" }),
      type: "admission",
      href: "/students",
    },
    {
      id: "act-2",
      title: t("feeReceived"),
      description: "৳ 12,500 · Student #STU-0821",
      timestamp: t("minutesAgo", { count: locale === "bn" ? "২৪" : "24" }),
      type: "payment",
      href: "/fees",
    },
    {
      id: "act-3",
      title: t("attendanceDone"),
      description: t("attendanceSummary", {
        className: "Class 7 (B)",
        count: locale === "bn" ? "৩২" : "32",
        percent: locale === "bn" ? "৯৭" : "97",
      }),
      timestamp: t("minutesAgo", { count: locale === "bn" ? "৪২" : "42" }),
      type: "attendance",
      href: "/attendance",
    },
    {
      id: "act-4",
      title: t("examScheduled"),
      description: t("examRoutineFinalized"),
      timestamp: t("hourAgo", { count: locale === "bn" ? "১" : "1" }),
      type: "exam",
      href: "/exams",
    },
  ]

  const items = activities && activities.length > 0 ? activities : defaultActivities

  return (
    <Panel className="h-full">
      <PanelHeader
        title={t("title")}
        description={t("description")}
        href="/reports"
        hrefLabel={t("auditLog")}
      />

      <ol className="relative px-4 py-4 sm:px-5">
        <span
          aria-hidden="true"
          className="absolute inset-y-6 left-[calc(1rem+0.6875rem)] w-px bg-border sm:left-[calc(1.25rem+0.6875rem)]"
        />
        {items.map((item) => {
          const config = ICON_MAP[item.type] || ICON_MAP.admission
          const Icon = config.icon
          const row = (
            <>
              <span className="relative z-10 mt-0.5 grid size-5.5 shrink-0 place-items-center rounded-full border border-border bg-card">
                <Icon className={cn("size-3", config.tone)} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-[13px] font-semibold text-foreground">{item.title}</span>
                  <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{item.timestamp}</span>
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.description}</span>
              </span>
            </>
          )

          return (
            <li key={item.id} className="relative">
              {item.href ? (
                <Link href={item.href} className="-mx-2 flex gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-subtle">
                  {row}
                </Link>
              ) : (
                <div className="-mx-2 flex gap-3 px-2 py-2.5">{row}</div>
              )}
            </li>
          )
        })}
      </ol>
    </Panel>
  )
}
