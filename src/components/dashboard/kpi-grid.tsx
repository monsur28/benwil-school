"use client"

import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { ClipboardCheck, GraduationCap, TrendingUp, Users, Wallet } from "lucide-react"
import { Card } from "@/components/ui/card"
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
  const currency = data.currencySymbol ?? "\u09F3"
  const metrics = [
    {
      title: t("totalStudents"), value: formatNumber(data.totalStudents, locale), detail: t("active", { count: formatNumber(data.activeStudents, locale) }), href: "/students", Icon: Users, icon: "bg-emerald-50 text-emerald-600", trend: t("studentsTrend"),
    },
    {
      title: t("todaysAttendance"), value: data.attendanceRecorded ? `${formatNumber(data.attendanceRate, locale)}%` : t("open"), detail: data.attendanceRecorded ? t("checkedIn", { count: formatNumber(data.totalCheckedIn, locale) }) : t("registerPending"), href: "/attendance", Icon: ClipboardCheck, icon: "bg-sky-50 text-sky-600", trend: data.attendanceRecorded ? t("attendanceTrend") : t("awaitingRollCall"),
    },
    {
      title: t("teachersAndStaff"), value: formatNumber(data.teacherCount + data.staffCount, locale), detail: t("supportStaffMembers", { count: formatNumber(data.staffCount, locale) }), href: "/teachers", Icon: GraduationCap, icon: "bg-amber-50 text-amber-600", trend: t("teachersTrend"),
    },
    {
      title: t("feeCollection"), value: formatCurrency(data.totalFeesCollected, locale, currency), detail: t("ofTarget", { percent: formatNumber(data.feeTargetPercent, locale) }), href: "/fees", Icon: Wallet, icon: "bg-rose-50 text-brand-red", trend: t("feesTrend"),
    },
  ]

  return (
    <section aria-label="School overview">
      <Card className="overflow-hidden rounded-xl border-border/80 bg-card shadow-[0_10px_28px_rgba(25,49,90,0.045)]">
        <div className="grid grid-cols-2 divide-x divide-y divide-border/70 xl:grid-cols-[1.15fr_repeat(4,minmax(0,1fr))] xl:divide-y-0">
          <div className="col-span-2 flex flex-col justify-center bg-muted/25 px-5 py-5 xl:col-span-1">
            <p className="font-heading text-xl font-bold tracking-tight text-brand-navy">Today on campus</p>
            <p className="mt-1 max-w-[15rem] text-sm leading-5 text-muted-foreground">A live view of people, learning and school operations.</p>
          </div>
          {metrics.map(({ title, value, detail, href, Icon, icon, trend }) => (
            <Link key={title} href={href} className="group min-w-0 px-4 py-5 transition-colors hover:bg-muted/35 xl:px-5">
              <div className="flex items-center gap-2.5">
                <span className={`grid size-9 shrink-0 place-items-center rounded-full ${icon}`}><Icon className="size-[18px]" strokeWidth={2.1} /></span>
                <p className="truncate text-xs font-semibold text-brand-navy">{title}</p>
              </div>
              <p className="mt-4 truncate font-mono text-[1.85rem] font-bold leading-none tracking-[-0.055em] text-brand-navy tabular-nums">{value}</p>
              <p className="mt-2 min-h-4 text-xs text-muted-foreground">{detail}</p>
              <p className="mt-3 inline-flex max-w-full items-center gap-1 text-[11px] font-semibold text-success"><TrendingUp className="size-3.5 shrink-0" /><span className="truncate">{trend}</span></p>
            </Link>
          ))}
        </div>
      </Card>
    </section>
  )
}
