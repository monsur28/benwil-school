"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { CalendarDays, CalendarPlus } from "lucide-react"
import { cn } from "cn"
import { Panel, PanelHeader } from "@/components/shared/panel"
import { IconBadge } from "@/components/ui/icon-badge"

export interface EventItem {
  id: string
  dateMonth: string
  dateDay: string
  title: string
  description: string
  badgeText?: string
  colorTheme: "amber" | "blue" | "emerald" | "purple"
  href?: string
  /** Days from today — drives the "this week" emphasis, never a fake urgency. */
  daysAway: number
}

/**
 * The colour of an event's date block says what kind of event it is, so the
 * column doubles as a category key. Tones come from the feature-surface
 * tokens, one per theme.
 */
const THEME: Record<EventItem["colorTheme"], string> = {
  amber: "bg-dashboard-yellow-light text-dashboard-yellow",
  blue: "bg-dashboard-blue-light text-dashboard-blue",
  emerald: "bg-dashboard-green-light text-dashboard-green",
  purple: "bg-dashboard-purple-light text-dashboard-purple",
}

/**
 * What is coming up.
 *
 * Built around a date rail: the day number is the largest thing on each row
 * because "when" is the question this section answers, and it sits in a tinted
 * block so the row is dated and categorised in one glance. Anything inside the
 * next seven days is called out, because that is the horizon a principal plans
 * against.
 *
 * Reference-priority content, so it stays short: the panel takes the height of
 * whatever is actually scheduled rather than padding itself out to match its
 * neighbours.
 */
export function UpcomingEventsCard({ events }: { events: EventItem[] }) {
  const t = useTranslations("dashboard.admin.milestones")

  return (
    <Panel>
      <PanelHeader
        title={t("title")}
        description={t("description")}
        icon={<CalendarDays />}
        iconTone="violet"
        href="/exams"
        hrefLabel={t("calendar")}
      />

      {events.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
          <IconBadge icon={CalendarPlus} tone="muted" size="md" />
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-foreground">{t("emptyTitle")}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("emptyDetail")}</p>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-border-light">
          {events.map((event) => {
            const row = (
              <>
                {/* Wide enough for a spelled-out Bangla month name, which is
                    several times longer than the English abbreviation. */}
                <span
                  className={cn(
                    "flex w-14 shrink-0 flex-col items-center rounded-lg px-1.5 py-1.5 text-center",
                    THEME[event.colorTheme]
                  )}
                >
                  <span className="w-full truncate text-[10px] font-semibold uppercase tracking-[0.08em] opacity-80">
                    {event.dateMonth}
                  </span>
                  <span className="metric mt-0.5 text-lg">{event.dateDay}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[13px] font-semibold text-foreground">{event.title}</span>
                    {event.daysAway <= 7 ? (
                      <span className="shrink-0 rounded border border-warning-border bg-warning-light px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
                        {t("thisWeek")}
                      </span>
                    ) : (
                      event.badgeText && <span className="eyebrow shrink-0">{event.badgeText}</span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {event.description}
                  </span>
                </span>
              </>
            )

            return (
              <li key={event.id}>
                {event.href ? (
                  <Link
                    href={event.href}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-subtle sm:px-5"
                  >
                    {row}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 sm:px-5">{row}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}
