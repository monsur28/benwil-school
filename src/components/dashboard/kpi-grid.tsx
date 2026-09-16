"use client"

import { useLocale, useTranslations } from "next-intl"
import { ClipboardCheck, GraduationCap, Users, Wallet } from "lucide-react"
import { StatRow, StatTile, StatDelta } from "@/components/shared/stat-tile"
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

/**
 * The four numbers a head teacher checks first, rendered as one hairline
 * band rather than four floating cards. The accent strip at the top of each
 * tile is the only colour: it carries the tile's meaning (people, attendance,
 * staffing, money) without turning the row into a pile of coloured squares.
 */
export function KpiGrid({ data }: { data: KpiData }) {
  const t = useTranslations("dashboard.admin.kpi")
  const locale = useLocale()
  const currency = data.currencySymbol ?? "৳"

  return (
    <StatRow columns={4}>
      <StatTile
        label={t("totalStudents")}
        value={formatNumber(data.totalStudents, locale)}
        detail={t("active", { count: formatNumber(data.activeStudents, locale) })}
        icon={<Users />}
        tone="brand"
        href="/students"
        footer={<StatDelta>{t("studentsTrend")}</StatDelta>}
      />

      <StatTile
        label={t("todaysAttendance")}
        value={data.attendanceRecorded ? `${formatNumber(data.attendanceRate, locale)}%` : t("open")}
        detail={
          data.attendanceRecorded
            ? t("checkedIn", { count: formatNumber(data.totalCheckedIn, locale) })
            : t("registerPending")
        }
        icon={<ClipboardCheck />}
        tone={data.attendanceRecorded ? "success" : "warning"}
        href="/attendance"
        footer={
          <StatDelta tone={data.attendanceRecorded ? "up" : "neutral"}>
            {data.attendanceRecorded ? t("attendanceTrend") : t("awaitingRollCall")}
          </StatDelta>
        }
      />

      <StatTile
        label={t("teachersAndStaff")}
        value={formatNumber(data.teacherCount + data.staffCount, locale)}
        detail={t("supportStaffMembers", { count: formatNumber(data.staffCount, locale) })}
        icon={<GraduationCap />}
        tone="info"
        href="/teachers"
        footer={<StatDelta>{t("teachersTrend")}</StatDelta>}
      />

      <StatTile
        label={t("feeCollection")}
        value={formatCurrency(data.totalFeesCollected, locale, currency)}
        detail={t("ofTarget", { percent: formatNumber(data.feeTargetPercent, locale) })}
        icon={<Wallet />}
        tone="neutral"
        href="/fees"
        footer={<StatDelta>{t("feesTrend")}</StatDelta>}
      />
    </StatRow>
  )
}
