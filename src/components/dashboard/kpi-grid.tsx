"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import {
  ArrowUpRight,
  ClipboardCheck,
  GraduationCap,
  TrendingDown,
  TrendingUp,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"
import { formatCurrency, formatNumber } from "@/lib/format"
import { IconBadge, type IconBadgeTone } from "@/components/ui/icon-badge"

export interface KpiData {
  totalStudents: number
  activeStudents: number
  classCount: number

  attendanceRecorded: boolean
  attendanceRate: number
  totalCheckedIn: number
  sectionsRecorded: number
  totalSections: number
  /** Percentage points against the previous day a register was taken, and the
      label of that day. Null whenever there is no earlier day to compare to —
      the tile then shows context instead of inventing a trend. */
  attendanceDelta: { points: number; sinceLabel: string } | null

  teacherCount: number
  staffCount: number

  totalFeesCollected: number
  feeTargetPercent: number
  /** Percent change against last month's collections. Null in a school's first
      month, or when last month took nothing (no base to divide by). */
  feeMonthDelta: number | null
  collectedThisMonth: number

  currencySymbol?: string
}

/**
 * The tone a headline metric carries. Each is a *meaning*, not a decoration:
 * people are blue, attendance green (amber while the register is still open),
 * staffing violet, money orange. All resolve to feature-surface tokens in
 * globals.css, so a re-themed school gets its own version of each.
 */
type Tone = "blue" | "green" | "amber" | "violet" | "orange"

const TONE: Record<Tone, { chip: string; accent: string; value: string }> = {
  blue: {
    chip: "bg-dashboard-blue-light text-dashboard-blue",
    accent: "bg-dashboard-blue",
    value: "text-brand-navy",
  },
  green: {
    chip: "bg-dashboard-green-light text-dashboard-green",
    accent: "bg-success",
    value: "text-success",
  },
  amber: {
    chip: "bg-dashboard-yellow-light text-dashboard-yellow",
    accent: "bg-warning",
    value: "text-warning",
  },
  violet: {
    chip: "bg-dashboard-purple-light text-dashboard-purple",
    accent: "bg-dashboard-purple",
    value: "text-brand-navy",
  },
  orange: {
    chip: "bg-dashboard-orange-light text-dashboard-orange",
    accent: "bg-dashboard-orange",
    value: "text-brand-navy",
  },
}

/**
 * One headline metric.
 *
 * Read order is enforced by type size: a tinted icon says what kind of fact
 * this is, a micro-caption names it, the number is by far the largest thing in
 * the tile, then detail and footing in muted text. The tone is carried by the
 * accent rule and the icon tint — the tile itself stays a plain white sheet,
 * the same as every card in the student portal.
 *
 * `trend` is only ever passed when a real comparison exists. Where the data
 * model keeps no history, the tile shows plain context on that last line
 * instead — a dashboard that invents a trend is worse than one that admits it
 * has no history yet.
 */
function KpiTile({
  label,
  value,
  detail,
  icon: Icon,
  tone,
  href,
  footer,
  trend,
}: {
  label: string
  value: ReactNode
  detail: string
  icon: LucideIcon
  tone: Tone
  href: string
  footer: string
  trend?: "up" | "down"
}) {
  const t = TONE[tone]
  const badgeToneMap: Record<Tone, IconBadgeTone> = {
    blue: "blue",
    green: "green",
    amber: "amber",
    violet: "purple",
    orange: "orange",
  }

  return (
    <Link
      href={href}
      className="group relative min-w-0 overflow-hidden bg-card px-4 py-5 transition-colors hover:bg-subtle sm:px-5"
    >
      <span aria-hidden="true" className={cn("absolute inset-x-0 top-0 h-[3px]", t.accent)} />

      <div className="relative flex items-start justify-between gap-3">
        <IconBadge icon={Icon} tone={badgeToneMap[tone]} size="lg" />
        <ArrowUpRight className="size-4 shrink-0 text-transparent transition-colors group-hover:text-muted-foreground" />
      </div>

      <p className="eyebrow relative mt-4 truncate">{label}</p>
      <p className={cn("metric relative mt-1.5 truncate text-[2rem]", t.value)}>{value}</p>
      <p className="relative mt-1.5 truncate text-[13px] text-muted-foreground">{detail}</p>

      <p
        className={cn(
          "relative mt-3 flex items-center gap-1.5 text-xs font-medium",
          trend === "up" && "text-success",
          trend === "down" && "text-danger",
          !trend && "text-muted-foreground"
        )}
      >
        {trend === "up" && <TrendingUp className="size-3.5 shrink-0" />}
        {trend === "down" && <TrendingDown className="size-3.5 shrink-0" />}
        <span className="truncate">{footer}</span>
      </p>
    </Link>
  )
}

/**
 * School pulse — the four numbers a head teacher checks first.
 *
 * One hairline-divided band rather than four floating cards: they are one
 * reading of the school taken at one moment, so they share a single sheet.
 */
export function KpiGrid({ data }: { data: KpiData }) {
  const t = useTranslations("dashboard.admin.kpi")
  const locale = useLocale()
  const currency = data.currencySymbol ?? "৳"

  const delta = data.attendanceDelta
  const feeDelta = data.feeMonthDelta

  return (
    <section
      aria-label={t("sectionLabel")}
      className="panel grid divide-y divide-border-light overflow-hidden sm:grid-cols-2 sm:divide-x lg:grid-cols-4 lg:divide-y-0"
    >
      {/* No enrolment history is stored, so this tile carries context, not a
          trend: how many are active and how many classes they sit across. */}
      <KpiTile
        label={t("totalStudents")}
        value={formatNumber(data.totalStudents, locale)}
        detail={t("active", { count: formatNumber(data.activeStudents, locale) })}
        icon={Users}
        tone="blue"
        href="/students"
        footer={t("acrossClasses", { count: formatNumber(data.classCount, locale), n: data.classCount })}
      />

      {/* A school that has not taken the register yet reads "Open" in the
          warning tone — never a fabricated rate. */}
      <KpiTile
        label={t("todaysAttendance")}
        value={data.attendanceRecorded ? `${formatNumber(data.attendanceRate, locale)}%` : t("open")}
        detail={
          data.attendanceRecorded
            ? t("checkedIn", { count: formatNumber(data.totalCheckedIn, locale) })
            : t("registerPending")
        }
        icon={ClipboardCheck}
        tone={data.attendanceRecorded ? "green" : "amber"}
        href="/attendance"
        trend={delta ? (delta.points >= 0 ? "up" : "down") : undefined}
        footer={
          delta
            ? t("pointsSince", {
                points: `${delta.points >= 0 ? "+" : "−"}${formatNumber(Math.abs(delta.points), locale)}`,
                day: delta.sinceLabel,
              })
            : t("sectionsRecorded", {
                recorded: formatNumber(data.sectionsRecorded, locale),
                total: formatNumber(data.totalSections, locale),
                n: data.totalSections,
              })
        }
      />

      {/* No activity tracking exists for staff, so this states the split it
          can prove rather than an engagement figure it cannot. */}
      <KpiTile
        label={t("teachersAndStaff")}
        value={formatNumber(data.teacherCount + data.staffCount, locale)}
        detail={t("supportStaffMembers", { count: formatNumber(data.staffCount, locale), n: data.staffCount })}
        icon={GraduationCap}
        tone="violet"
        href="/teachers"
        footer={t("teachersOnRoster", { count: formatNumber(data.teacherCount, locale), n: data.teacherCount })}
      />

      <KpiTile
        label={t("feeCollection")}
        value={formatCurrency(data.totalFeesCollected, locale, currency)}
        detail={t("ofTarget", { percent: formatNumber(data.feeTargetPercent, locale) })}
        icon={WalletCards}
        tone="orange"
        href="/fees"
        trend={feeDelta === null ? undefined : feeDelta >= 0 ? "up" : "down"}
        footer={
          feeDelta === null
            ? t("collectedThisMonth", {
                amount: formatCurrency(data.collectedThisMonth, locale, currency),
              })
            : t("vsLastMonth", {
                percent: `${feeDelta >= 0 ? "+" : "−"}${formatNumber(Math.abs(feeDelta), locale)}`,
              })
        }
      />
    </section>
  )
}
