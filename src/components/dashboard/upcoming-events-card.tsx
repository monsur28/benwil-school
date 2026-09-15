"use client"

import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar, ArrowUpRight } from "lucide-react"
import { cn } from "cn"

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

const COLOR_STYLES = {
  amber: "border-dashboard-yellow/20 bg-dashboard-yellow-light text-dashboard-yellow",
  blue: "border-dashboard-blue/20 bg-dashboard-blue-light text-dashboard-blue",
  emerald: "border-dashboard-green/20 bg-dashboard-green-light text-dashboard-green",
  purple: "border-dashboard-purple/20 bg-dashboard-purple-light text-dashboard-purple",
}

export function UpcomingEventsCard({ events }: UpcomingEventsCardProps) {
  const t = useTranslations("dashboard.admin.milestones")
  const locale = useLocale()

  const defaultEvents: EventItem[] = [
    {
      id: "evt-1",
      dateMonth: t("sep"),
      dateDay: locale === "bn" ? "১৮" : "18",
      title: t("midTermTitle"),
      description: t("midTermDesc"),
      badgeText: t("badgeAcademic"),
      colorTheme: "amber",
      href: "/exams",
    },
    {
      id: "evt-2",
      dateMonth: t("sep"),
      dateDay: locale === "bn" ? "২২" : "22",
      title: t("ptmTitle"),
      description: t("ptmDesc"),
      badgeText: t("badgeMeeting"),
      colorTheme: "blue",
      href: "/notices",
    },
    {
      id: "evt-3",
      dateMonth: t("oct"),
      dateDay: locale === "bn" ? "০২" : "02",
      title: t("scienceFairTitle"),
      description: t("scienceFairDesc"),
      badgeText: t("badgeCoCurricular"),
      colorTheme: "emerald",
      href: "/notices",
    },
    {
      id: "evt-4",
      dateMonth: t("oct"),
      dateDay: locale === "bn" ? "১৫" : "15",
      title: t("resultPubTitle"),
      description: t("resultPubDesc"),
      badgeText: t("badgeGrading"),
      colorTheme: "purple",
      href: "/results",
    },
  ]

  const items = events && events.length > 0 ? events : defaultEvents

  return (
    <Card className="flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-5 shadow-xs">
      <CardHeader className="p-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-dashboard-yellow-light text-dashboard-yellow">
              <Calendar className="size-4" />
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
            href="/exams"
            className="group flex items-center gap-1 text-xs font-semibold text-brand-navy hover:underline"
          >
            <span>{t("calendar")}</span>
            <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </CardHeader>

      <div className="space-y-3 pt-1">
        {items.map((event) => (
          <div
            key={event.id}
            className="group flex items-start gap-3 rounded-xl p-2 transition-colors hover:bg-muted/40"
          >
            {/* Small Date Block */}
            <div
              className={cn(
                "flex flex-col items-center justify-center rounded-xl border px-2.5 py-1 text-center shrink-0 min-w-11",
                COLOR_STYLES[event.colorTheme]
              )}
            >
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider">
                {event.dateMonth}
              </span>
              <span className="font-mono text-base font-bold leading-tight">
                {event.dateDay}
              </span>
            </div>

            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-foreground">
                  {event.title}
                </p>
                {event.badgeText && (
                  <span className="shrink-0 rounded-full border border-border/60 bg-muted/40 px-2 py-0.2 text-[9px] font-medium text-muted-foreground">
                    {event.badgeText}
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {event.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
        <span>{t("termCalendar")}</span>
        <span className="font-mono text-foreground font-medium">
          {t("activeEvents", { count: locale === "bn" ? "৪" : "4" })}
        </span>
      </div>
    </Card>
  )
}
