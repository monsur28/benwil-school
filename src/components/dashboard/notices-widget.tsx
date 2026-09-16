"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Megaphone, ArrowUpRight } from "lucide-react"
import { cn } from "cn"

export interface NoticeItem {
  id: string
  title: string
  scope: string
  date: string
  priority: "urgent" | "important" | "normal"
}

interface NoticesWidgetProps {
  notices?: NoticeItem[]
}

const PRIORITY_DOT = {
  urgent: "bg-danger",
  important: "bg-dashboard-orange",
  normal: "bg-dashboard-blue",
}

export function NoticesWidget({ notices }: NoticesWidgetProps) {
  const t = useTranslations("dashboard.admin.notices")

  const defaultNotices: NoticeItem[] = [
    {
      id: "notice-1",
      title: t("emergencyTitle"),
      scope: t("emergencyScope"),
      date: t("today"),
      priority: "urgent",
    },
    {
      id: "notice-2",
      title: t("ptmTitle"),
      scope: t("ptmScope"),
      date: "Sep 14",
      priority: "important",
    },
    {
      id: "notice-3",
      title: t("examRoutineTitle"),
      scope: t("examRoutineScope"),
      date: "Sep 12",
      priority: "normal",
    },
  ]

  const isSample = !notices || notices.length === 0
  const items = isSample ? defaultNotices : notices

  return (
    <Card className="flex flex-col justify-between rounded-xl border border-border/60 bg-card p-4 shadow-xs">
      <CardHeader className="p-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-dashboard-blue-light text-dashboard-blue">
              <Megaphone className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold tracking-tight text-foreground">
                {t("title")}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {t("description")}
              </CardDescription>
            </div>
          </div>

          <Link
            href="/notices"
            className="group flex items-center gap-1 text-xs font-semibold text-brand-navy hover:underline"
          >
            <span>{t("viewAll")}</span>
            <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </CardHeader>

      <div className="space-y-1 pt-1">
        {items.map((notice) => (
          <Link
            key={notice.id}
            href="/notices"
            className="group flex items-start gap-2.5 rounded-xl p-2 transition-colors hover:bg-muted/40"
          >
            <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", PRIORITY_DOT[notice.priority])} />
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="text-xs font-semibold text-foreground">
                {notice.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {notice.scope} Â· {notice.date}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
        <span>{t("footer")}</span>
        {isSample && (
          <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {t("sampleBadge")}
          </span>
        )}
      </div>
    </Card>
  )
}
