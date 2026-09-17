"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { AlertTriangle, Bell, BellOff, BookOpen, GraduationCap, Megaphone, Users } from "lucide-react"
import { cn } from "cn"
import { Panel, PanelHeader } from "@/components/shared/panel"
import { IconBadge, type IconBadgeTone } from "@/components/ui/icon-badge"

export type NoticeAudience = "ALL" | "STUDENTS" | "GUARDIANS" | "CLASS" | "SECTION"

export interface NoticeItem {
  id: string
  title: string
  scope: string
  date: string
  priority: "urgent" | "important" | "normal"
  audience?: NoticeAudience
}

interface NoticesWidgetProps {
  notices?: NoticeItem[]
}

/**
 * Urgency outranks category: anything that cannot wait takes the rose alert
 * regardless of who it is addressed to.
 */
const PRIORITY: Record<"urgent" | "important", { icon: typeof AlertTriangle; tone: IconBadgeTone }> = {
  urgent: { icon: AlertTriangle, tone: "rose" },
  important: { icon: Megaphone, tone: "orange" },
}

/**
 * Otherwise the icon states *who the notice is for* — read straight off the
 * notice's own audience, never invented: a megaphone in blue for the whole
 * campus, students green, guardians violet, a single class or section amber.
 * Solid squircle badges match Photo 1.
 */
const AUDIENCE: Record<NoticeAudience, { icon: typeof Users; tone: IconBadgeTone }> = {
  ALL: { icon: Megaphone, tone: "blue" },
  STUDENTS: { icon: GraduationCap, tone: "green" },
  GUARDIANS: { icon: Users, tone: "purple" },
  CLASS: { icon: BookOpen, tone: "orange" },
  SECTION: { icon: BookOpen, tone: "orange" },
}

export function NoticesWidget({ notices }: NoticesWidgetProps) {
  const t = useTranslations("dashboard.admin.notices")
  const items = notices ?? []

  return (
    <Panel className="h-full">
      <PanelHeader
        title={t("title")}
        description={t("description")}
        icon={<Bell />}
        iconTone="blue"
        href="/notices"
        hrefLabel={t("viewAll")}
      />
      {items.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
          <IconBadge icon={BellOff} tone="muted" size="md" />
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-foreground">{t("emptyTitle")}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("emptyDetail")}</p>
          </div>
        </div>
      ) : (
      <ul className="divide-y divide-border-light">
        {items.map((notice) => {
          const marker =
            notice.priority === "urgent" || notice.priority === "important"
              ? PRIORITY[notice.priority]
              : AUDIENCE[notice.audience ?? "ALL"]
          const Icon = marker.icon
          return (
            <li key={notice.id}>
              <Link
                href="/notices"
                className="group flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-subtle sm:px-5"
              >
                <IconBadge icon={Icon} tone={marker.tone} size="sm" className="mt-0.5" />
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
          )
        })}
      </ul>
      )}
    </Panel>
  )
}
