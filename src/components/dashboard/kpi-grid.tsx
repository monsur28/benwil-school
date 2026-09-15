"use client"

import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { Users, ClipboardCheck, GraduationCap, Wallet, TrendingUp, ArrowUpRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "cn"
import { formatCurrency, formatNumber } from "@/lib/format"

export interface KpiData {
  totalStudents: number
  activeStudents: number
  classCount: number
  attendanceRate: number
  attendanceRecorded: boolean
  totalCheckedIn: number
  teacherCount: number
  staffCount: number
  totalFeesCollected: number
  feeTargetPercent: number
  currencySymbol?: string
}

export function KpiGrid({ data }: { data: KpiData }) {
  const t = useTranslations("dashboard.admin.kpi")
  const locale = useLocale()
  const currency = data.currencySymbol ?? "৳"

  // Category colors per design.md §3 (Purple -> students/academics, Blue ->
  // attendance/information, Yellow -> teachers/activities); fee collection
  // isn't in that table, so it reuses the "success/healthy" green already
  // established for collected-fees figures in FeeAnalyticsCard.
  const cards = [
    {
      title: t("totalStudents"),
      value: formatNumber(data.totalStudents, locale),
      subValue: t("active", { count: formatNumber(data.activeStudents, locale) }),
      trend: t("studentsTrend"),
      trendPositive: true,
      href: "/students",
      colorKey: "purple",
      icon: Users,
      iconBg: "bg-dashboard-purple-light text-dashboard-purple",
      accentBorder: "hover:border-dashboard-purple/30",
      pillBg: "bg-dashboard-purple-light text-dashboard-purple border-dashboard-purple/20",
      detail: t("acrossClasses", { count: formatNumber(data.classCount, locale) }),
    },
    {
      title: t("todaysAttendance"),
      value: data.attendanceRecorded ? `${formatNumber(data.attendanceRate, locale)}%` : t("open"),
      subValue: data.attendanceRecorded
        ? t("checkedIn", { count: formatNumber(data.totalCheckedIn, locale) })
        : t("registerPending"),
      trend: data.attendanceRecorded ? t("attendanceTrend") : t("awaitingRollCall"),
      trendPositive: data.attendanceRecorded,
      href: "/attendance",
      colorKey: "blue",
      icon: ClipboardCheck,
      iconBg: "bg-dashboard-blue-light text-dashboard-blue",
      accentBorder: "hover:border-dashboard-blue/30",
      pillBg: "bg-dashboard-blue-light text-dashboard-blue border-dashboard-blue/20",
      detail: data.attendanceRecorded ? t("dailyRollCallInProgress") : t("pendingClassSubmission"),
    },
    {
      title: t("teachersAndStaff"),
      value: formatNumber(data.teacherCount + data.staffCount, locale),
      subValue: t("certified", { count: formatNumber(data.teacherCount, locale) }),
      trend: t("teachersTrend"),
      trendPositive: true,
      href: "/teachers",
      colorKey: "yellow",
      icon: GraduationCap,
      iconBg: "bg-dashboard-yellow-light text-dashboard-yellow",
      accentBorder: "hover:border-dashboard-yellow/30",
      pillBg: "bg-dashboard-yellow-light text-dashboard-yellow border-dashboard-yellow/20",
      detail: t("supportStaffMembers", { count: formatNumber(data.staffCount, locale) }),
    },
    {
      title: t("feeCollection"),
      value: formatCurrency(data.totalFeesCollected, locale, currency),
      subValue: t("ofTarget", { percent: formatNumber(data.feeTargetPercent, locale) }),
      trend: t("feesTrend"),
      trendPositive: true,
      href: "/fees",
      colorKey: "green",
      icon: Wallet,
      iconBg: "bg-dashboard-green-light text-dashboard-green",
      accentBorder: "hover:border-dashboard-green/30",
      pillBg: "bg-dashboard-green-light text-dashboard-green border-dashboard-green/20",
      detail: t("cashflowOnTrack"),
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.title}
          className={cn(
            "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition-all duration-200 hover:shadow-xs",
            card.accentBorder
          )}
        >
          <div className="space-y-3">
            {/* Top row: Icon + Title + Arrow */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={cn("flex size-9 items-center justify-center rounded-xl", card.iconBg)}>
                  <card.icon className="size-4.5" />
                </div>
                <span className="text-xs font-semibold tracking-tight text-muted-foreground">
                  {card.title}
                </span>
              </div>

              <Link
                href={card.href}
                className="rounded-lg p-1 text-muted-foreground/50 transition-colors group-hover:text-foreground hover:bg-muted"
                aria-label={`View ${card.title}`}
              >
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>

            {/* Metric Value */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-bold tracking-tight text-foreground">
                  {card.value}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  / {card.subValue}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground/80">
                {card.detail}
              </p>
            </div>
          </div>

          {/* Bottom trend pill */}
          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide",
                card.pillBg
              )}
            >
              <TrendingUp className="size-3" />
              {card.trend}
            </span>

            <Link
              href={card.href}
              className="text-[11px] font-medium text-muted-foreground/70 group-hover:text-brand-navy transition-colors"
            >
              {t("details")}
            </Link>
          </div>
        </Card>
      ))}
    </div>
  )
}
