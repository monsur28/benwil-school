"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { UserPlus, ClipboardCheck, CalendarClock, Wallet, Megaphone, ArrowUpRight } from "lucide-react"

const ACTIONS = [
  { href: "/students/new", key: "addStudent", icon: UserPlus },
  { href: "/attendance", key: "takeAttendance", icon: ClipboardCheck },
  { href: "/exams", key: "createExam", icon: CalendarClock },
  { href: "/fees", key: "collectFee", icon: Wallet },
  { href: "/notices", key: "createNotice", icon: Megaphone },
] as const

/**
 * The five things staff start most often.
 *
 * Presented as a single row of quiet chips sitting directly on the canvas —
 * not five more cards. They are shortcuts, so they read at the weight of
 * navigation, below the metrics and above the analysis.
 */
export function CompactQuickActions() {
  const t = useTranslations("dashboard.admin.quickActions")

  return (
    <section aria-label={t("title")} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="eyebrow">{t("title")}</h2>
        <span className="text-xs text-muted-foreground">{t("subtitle")}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3 transition-colors hover:border-border-strong hover:bg-subtle"
          >
            <action.icon className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
            {/* Two-up on a phone leaves no room for a caption, so the label
                gets the whole chip there and the description returns at sm. */}
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold leading-snug text-foreground">
                {t(action.key)}
              </span>
              <span className="mt-0.5 hidden truncate text-[11px] text-muted-foreground sm:block">
                {t(`${action.key}Desc`)}
              </span>
            </span>
            <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground/0 transition-all group-hover:text-muted-foreground" />
          </Link>
        ))}
      </div>
    </section>
  )
}
