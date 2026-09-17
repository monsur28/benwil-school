"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { IconBadge, type IconBadgeName, type IconBadgeTone } from "@/components/ui/icon-badge"
import { cn } from "cn"

/**
 * Ordered by how often a principal actually starts each job, not by module
 * order: the register is a daily duty, results and fees are weekly, a notice
 * is occasional, and admitting a student is rare outside admission season.
 *
 * Rendered using unified reusable IconBadge squircles so both dashboards share
 * one coherent visual language across the whole system.
 */
const ACTIONS: {
  href: string
  key: string
  name: IconBadgeName
  tone: IconBadgeTone
}[] = [
  { href: "/attendance", key: "takeAttendance", name: "attendance", tone: "blue" },
  { href: "/results", key: "reviewResults", name: "results", tone: "green" },
  { href: "/fees/payments/new", key: "collectFee", name: "fees", tone: "orange" },
  { href: "/notices", key: "createNotice", name: "notice", tone: "rose" },
  { href: "/students/new", key: "addStudent", name: "student", tone: "purple" },
]

export function CompactQuickActions() {
  const t = useTranslations("dashboard.admin.quickActions")

  return (
    <section aria-labelledby="quick-actions-heading" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="quick-actions-heading" className="eyebrow">
          {t("title")}
        </h2>
        <span className="text-xs text-muted-foreground">{t("subtitle")}</span>
      </div>

      {/* Two-up on a phone (comfortable 44px+ targets), five across from lg. */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex min-h-[92px] min-w-0 flex-col rounded-xl border border-border/70 bg-[#fafaf8] p-3.5 transition-all hover:-translate-y-0.5 hover:border-border hover:bg-card hover:shadow-xs"
          >
            <IconBadge name={action.name} tone={action.tone} size="md" />
            <span className="mt-2.5 block truncate text-[13px] font-bold leading-snug text-brand-navy group-hover:text-primary">
              {t(action.key)}
            </span>
            {/* Two-up on a phone leaves no room for a caption, so the label
                gets the whole tile there and the description returns at sm. */}
            <span className="mt-0.5 hidden truncate text-[11px] text-muted-foreground sm:block">
              {t(`${action.key}Desc`)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}

