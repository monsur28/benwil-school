import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { ArrowRight, CalendarCheck, CircleCheck, FileEdit, ScrollText, TriangleAlert, WalletCards } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "cn"
import { IconBadge, type IconBadgeTone } from "@/components/ui/icon-badge"

export type AttentionLevel = "critical" | "attention" | "info"

export interface AttentionItem {
  id: string
  level: AttentionLevel
  icon: LucideIcon
  title: string
  detail: string
  href: string
  actionLabel: string
}

/**
 * Three levels, three tones as solid squircle badges.
 */
const LEVEL: Record<AttentionLevel, IconBadgeTone> = {
  critical: "rose",
  attention: "orange",
  info: "blue",
}

const ORDER: Record<AttentionLevel, number> = { critical: 0, attention: 1, info: 2 }

/**
 * What the principal has to do something about, today.
 *
 * This is the only P0 block on the dashboard: everything below it reports,
 * this one asks. Every row is derived from a real record — a register nobody
 * filled, an exam whose marks are still sealed, students carrying dues, a
 * notice still sitting in draft — and every row is a link straight to the
 * screen where the job gets done.
 *
 * Deliberately not a red banner. It is a calm, compact list that happens to
 * be first; alarm is reserved for the one tone that means it.
 */
export async function AttentionPanel({
  signals,
  currencyAmount,
}: {
  signals: {
    register: { pendingSections: number; totalSections: number }
    unpublishedResults: number
    dues: { students: number; amount: number }
    draftNotices: number
  }
  /** Pre-formatted by the server component that owns locale + currency. */
  currencyAmount: string
}) {
  const t = await getTranslations("dashboard.admin.attention")

  const items: AttentionItem[] = []

  if (signals.register.pendingSections > 0) {
    items.push({
      id: "register",
      // A register missed for the whole school is a different problem from one
      // section running late, and the tone says which.
      level:
        signals.register.pendingSections === signals.register.totalSections ? "attention" : "info",
      icon: CalendarCheck,
      title: t("registerTitle"),
      detail: t("registerDetail", {
        pending: signals.register.pendingSections,
        total: signals.register.totalSections,
        n: signals.register.totalSections,
      }),
      href: "/attendance",
      actionLabel: t("take"),
    })
  }

  if (signals.unpublishedResults > 0) {
    items.push({
      id: "results",
      level: "attention",
      icon: ScrollText,
      title: t("resultsTitle"),
      detail: t("resultsDetail", { count: signals.unpublishedResults, n: signals.unpublishedResults }),
      href: "/results",
      actionLabel: t("review"),
    })
  }

  if (signals.dues.students > 0) {
    items.push({
      id: "dues",
      level: "attention",
      icon: WalletCards,
      title: t("duesTitle"),
      detail: t("duesDetail", { count: signals.dues.students, n: signals.dues.students, amount: currencyAmount }),
      href: "/fees/reports/outstanding",
      actionLabel: t("open"),
    })
  }

  if (signals.draftNotices > 0) {
    items.push({
      id: "drafts",
      level: "info",
      icon: FileEdit,
      title: t("draftsTitle"),
      detail: t("draftsDetail", { count: signals.draftNotices, n: signals.draftNotices }),
      href: "/notices",
      actionLabel: t("publish"),
    })
  }

  items.sort((a, b) => ORDER[a.level] - ORDER[b.level])

  // The all-clear is a real state worth showing, not a blank. A principal who
  // opens this and sees green has learned something.
  if (items.length === 0) {
    return (
      <section
        aria-labelledby="attention-heading"
        className="flex items-center gap-3 rounded-xl border border-surface-green-border bg-surface-green px-4 py-3.5 sm:px-5"
      >
        <IconBadge icon={CircleCheck} tone="green" size="md" />
        <div className="min-w-0">
          <h2 id="attention-heading" className="text-[13px] font-semibold text-surface-green-foreground">
            {t("clearTitle")}
          </h2>
          <p className="mt-0.5 text-xs text-surface-green-foreground/80">{t("clearDetail")}</p>
        </div>
      </section>
    )
  }

  const highest = items[0].level

  return (
    <section aria-labelledby="attention-heading" className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-light px-4 py-3 sm:px-5">
        <h2 id="attention-heading" className="flex items-center gap-2.5">
          <IconBadge icon={TriangleAlert} tone={LEVEL[highest]} size="sm" />
          <span className="title-section">{t("title")}</span>
        </h2>
        <span className="text-xs font-medium text-muted-foreground">
          {t("count", { count: items.length })}
        </span>
      </div>

      <ul className="divide-y divide-border-light">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-subtle sm:px-5"
            >
              <IconBadge icon={item.icon} tone={LEVEL[item.level]} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-foreground">
                  {item.title}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {item.detail}
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-primary">
                <span className="hidden sm:inline">{item.actionLabel}</span>
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
