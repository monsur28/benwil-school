"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { UserPlus, WalletCards, ClipboardCheck, CalendarClock, Megaphone, Radio, Inbox } from "lucide-react"
import { cn } from "cn"
import { Panel, PanelHeader } from "@/components/shared/panel"
import { IconBadge, type IconBadgeTone } from "@/components/ui/icon-badge"

export type ActivityGroup = "today" | "yesterday" | "earlier"

export interface ActivityItem {
  id: string
  title: string
  description: string
  /** Clock time, formatted by the server that knows the request's locale. */
  time: string
  group: ActivityGroup
  type: "admission" | "payment" | "attendance" | "exam" | "notice"
  href?: string
}

/**
 * Each kind of event keeps the tone its module carries elsewhere on the
 * dashboard — admissions violet, money green, attendance blue, academics
 * orange, announcements rose — with vibrant solid squircles matching Photo 1.
 */
const ICON_MAP: Record<
  ActivityItem["type"],
  { icon: typeof UserPlus; tone: IconBadgeTone }
> = {
  admission: { icon: UserPlus, tone: "purple" },
  payment: { icon: WalletCards, tone: "green" },
  attendance: { icon: ClipboardCheck, tone: "blue" },
  exam: { icon: CalendarClock, tone: "orange" },
  notice: { icon: Megaphone, tone: "rose" },
}

const GROUP_ORDER: ActivityGroup[] = ["today", "yesterday", "earlier"]

/**
 * What just happened in the school.
 *
 * A true timeline — one connector line through tinted nodes — broken by day,
 * because "did this happen this morning or last week" is most of what a
 * principal wants from a feed. Every timestamp is the record's own; nothing
 * here is generated to fill the panel.
 */
export function RecentActivityFeed({ activities }: { activities: ActivityItem[] }) {
  const t = useTranslations("dashboard.admin.activity")

  const groups = GROUP_ORDER.map((group) => ({
    group,
    items: activities.filter((item) => item.group === group),
  })).filter((entry) => entry.items.length > 0)

  return (
    <Panel className="h-full">
      <PanelHeader
        title={t("title")}
        description={t("description")}
        icon={<Radio />}
        iconTone="rose"
        href="/reports"
        hrefLabel={t("auditLog")}
      />

      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
          <IconBadge icon={Inbox} tone="muted" size="md" />
          <p className="text-[13px] font-medium text-foreground">{t("emptyTitle")}</p>
          <p className="max-w-xs text-xs text-muted-foreground">{t("emptyDetail")}</p>
        </div>
      ) : (
        <div className="px-4 py-4 sm:px-5">
          {groups.map((entry) => (
            <section key={entry.group} className="not-first:mt-4">
              <h3 className="eyebrow mb-2">{t(`group.${entry.group}`)}</h3>
              <ol className="relative">
                <span
                  aria-hidden="true"
                  className="absolute inset-y-3 left-4 w-px bg-border"
                />
                {entry.items.map((item) => {
                  const config = ICON_MAP[item.type] ?? ICON_MAP.admission
                  const Icon = config.icon
                  const row = (
                    <>
                      <IconBadge
                        icon={Icon}
                        tone={config.tone}
                        size="sm"
                        className="relative z-10 mt-0.5 ring-3 ring-card"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="truncate text-[13px] font-semibold text-foreground">
                            {item.title}
                          </span>
                          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                            {item.time}
                          </span>
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      </span>
                    </>
                  )

                  return (
                    <li key={item.id} className="relative">
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="-mx-2 flex gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-subtle"
                        >
                          {row}
                        </Link>
                      ) : (
                        <div className="-mx-2 flex gap-3 px-2 py-2">{row}</div>
                      )}
                    </li>
                  )
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
    </Panel>
  )
}
