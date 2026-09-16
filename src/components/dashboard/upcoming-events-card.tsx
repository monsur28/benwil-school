"use client"

import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { Panel, PanelHeader } from "@/components/shared/panel"

export interface EventItem {
  id: string
  dateMonth: string
  dateDay: string
  title: string
  description: string
  badgeText?: string
  colorTheme: "amber" | "blue" | "emerald" | "purple"
  href?: string
}

interface UpcomingEventsCardProps {
  events?: EventItem[]
}

/**
 * What is coming up.
 *
 * Built around a date rail: the day number is the largest thing on each row
 * because "when" is the question this section answers. No coloured date
 * blocks — the calendar reads as a schedule, not as a set of stickers.
 */
export function UpcomingEventsCard({ events }: UpcomingEventsCardProps) {
  const t = useTranslations("dashboard.admin.milestones")
  const locale = useLocale()

  const defaultEvents: EventItem[] = [
    { id: "evt-1", dateMonth: t("sep"), dateDay: locale === "bn" ? "১৮" : "18", title: t("midTermTitle"), description: t("midTermDesc"), badgeText: t("badgeAcademic"), colorTheme: "amber", href: "/exams" },
    { id: "evt-2", dateMonth: t("sep"), dateDay: locale === "bn" ? "২২" : "22", title: t("ptmTitle"), description: t("ptmDesc"), badgeText: t("badgeMeeting"), colorTheme: "blue", href: "/notices" },
    { id: "evt-3", dateMonth: t("oct"), dateDay: locale === "bn" ? "০২" : "02", title: t("scienceFairTitle"), description: t("scienceFairDesc"), badgeText: t("badgeCoCurricular"), colorTheme: "emerald", href: "/notices" },
    { id: "evt-4", dateMonth: t("oct"), dateDay: locale === "bn" ? "১৫" : "15", title: t("resultPubTitle"), description: t("resultPubDesc"), badgeText: t("badgeGrading"), colorTheme: "purple", href: "/results" },
  ]

  const items = events && events.length > 0 ? events : defaultEvents

  return (
    <Panel className="h-full">
      <PanelHeader
        title={t("title")}
        description={t("description")}
        href="/exams"
        hrefLabel={t("calendar")}
      />

      <ul className="divide-y divide-border-light">
        {items.map((event) => {
          const row = (
            <>
              {/* Wide enough for a spelled-out Bangla month name, which is
                  several times longer than the English abbreviation. */}
              <span className="flex w-16 shrink-0 flex-col items-center border-r border-border-light pr-3 text-center">
                <span className="w-full truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {event.dateMonth}
                </span>
                <span className="metric mt-0.5 text-lg text-foreground">{event.dateDay}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[13px] font-semibold text-foreground">{event.title}</span>
                  {event.badgeText && (
                    <span className="eyebrow shrink-0">{event.badgeText}</span>
                  )}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">{event.description}</span>
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
    </Panel>
  )
}
