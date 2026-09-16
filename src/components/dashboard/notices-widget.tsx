"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { cn } from "cn"
import { Panel, PanelHeader } from "@/components/shared/panel"
import { Badge } from "@/components/ui/badge"

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

const PRIORITY_RAIL = {
  urgent: "bg-danger",
  important: "bg-warning",
  normal: "bg-border-strong",
}

/**
 * The notice board.
 *
 * Rendered as a divided list — each notice is a row with a priority rail on
 * its left edge, so urgency is legible in peripheral vision without a badge
 * on every line.
 */
export function NoticesWidget({ notices }: NoticesWidgetProps) {
  const t = useTranslations("dashboard.admin.notices")

  const defaultNotices: NoticeItem[] = [
    { id: "notice-1", title: t("emergencyTitle"), scope: t("emergencyScope"), date: t("today"), priority: "urgent" },
    { id: "notice-2", title: t("ptmTitle"), scope: t("ptmScope"), date: "Sep 14", priority: "important" },
    { id: "notice-3", title: t("examRoutineTitle"), scope: t("examRoutineScope"), date: "Sep 12", priority: "normal" },
  ]

  const isSample = !notices || notices.length === 0
  const items = isSample ? defaultNotices : notices

  return (
    <Panel className="h-full">
      <PanelHeader
        title={t("title")}
        description={t("description")}
        href="/notices"
        hrefLabel={t("viewAll")}
      />
      <ul className="divide-y divide-border-light">
        {items.map((notice) => (
          <li key={notice.id}>
            <Link
              href="/notices"
              className="group flex items-stretch gap-3 px-4 py-3.5 transition-colors hover:bg-subtle sm:px-5"
            >
              <span
                aria-hidden="true"
                className={cn("w-0.5 shrink-0 rounded-full", PRIORITY_RAIL[notice.priority])}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-foreground group-hover:text-primary">
                  {notice.title}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {notice.scope} · {notice.date}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {isSample && (
        <div className="strip border-t border-border-light px-4 py-2.5 sm:px-5">
          <Badge variant="muted">{t("sampleBadge")}</Badge>
        </div>
      )}
    </Panel>
  )
}
