"use client"

import { useLocale, useTranslations } from "next-intl"
import { CalendarCheck, HeartPulse, ScrollText, Users, WalletCards, type LucideIcon } from "lucide-react"
import { cn } from "cn"
import { Panel, PanelHeader } from "@/components/shared/panel"
import { Badge } from "@/components/ui/badge"
import { formatNumber } from "@/lib/format"
import { IconBadge, type IconBadgeTone } from "@/components/ui/icon-badge"

export interface SchoolHealthMetrics {
  /** Null until today's register is taken. */
  attendanceRate: number | null
  feeCollectionRate: number
  /** Share of finished exams whose results are published. Null if none have
      finished yet — there is nothing to be behind on. */
  resultPublicationRate: number | null
  /** Share of the roster that is still active. */
  activeEnrolmentRate: number
}

type Status = "healthy" | "onTarget" | "needsAttention" | "critical" | "unknown"

/**
 * One reading, one verdict. The thresholds are the same for every metric so a
 * principal learns them once: at or above 90 is healthy, 75 is on target,
 * below 50 needs acting on today. Status is always written as a word as well
 * as a colour — colour is never the only carrier.
 */
function statusOf(value: number | null): Status {
  if (value === null) return "unknown"
  if (value >= 90) return "healthy"
  if (value >= 75) return "onTarget"
  if (value >= 50) return "needsAttention"
  return "critical"
}

const STATUS_STYLE: Record<Status, { bar: string; text: string }> = {
  healthy: { bar: "bg-success", text: "text-success" },
  onTarget: { bar: "bg-dashboard-blue", text: "text-info" },
  needsAttention: { bar: "bg-warning", text: "text-warning" },
  critical: { bar: "bg-danger", text: "text-danger" },
  unknown: { bar: "bg-border-strong", text: "text-muted-foreground" },
}

const STATUS_TONE: Record<Status, IconBadgeTone> = {
  healthy: "green",
  onTarget: "blue",
  needsAttention: "orange",
  critical: "rose",
  unknown: "muted",
}

const SEVERITY: Record<Status, number> = {
  critical: 0,
  needsAttention: 1,
  onTarget: 2,
  healthy: 3,
  unknown: 4,
}

/**
 * Is anything abnormal?
 *
 * Four ratios the database can actually prove, each as a measured bar with a
 * plain-language verdict beside it. Nothing here is illustrative: a metric
 * with no data yet says so rather than showing a number that looks measured.
 */
export function SchoolHealthCard({ metrics }: { metrics: SchoolHealthMetrics }) {
  const t = useTranslations("dashboard.admin.healthIndex")
  const locale = useLocale()

  const items: { label: string; value: number | null; icon: LucideIcon }[] = [
    { label: t("campusAttendance"), value: metrics.attendanceRate, icon: CalendarCheck },
    { label: t("feeCollectionPace"), value: metrics.feeCollectionRate, icon: WalletCards },
    { label: t("examResultPublication"), value: metrics.resultPublicationRate, icon: ScrollText },
    { label: t("activeEnrolment"), value: metrics.activeEnrolmentRate, icon: Users },
  ]

  const measured = items.filter((item) => item.value !== null)
  const composite =
    measured.length > 0
      ? Math.round((measured.reduce((sum, item) => sum + (item.value ?? 0), 0) / measured.length) * 10) / 10
      : null

  // The panel's own badge reports the worst thing in it — the principal should
  // not have to read four rows to learn that one is on fire.
  const worst = measured
    .map((item) => statusOf(item.value))
    .sort((a, b) => SEVERITY[a] - SEVERITY[b])[0] as Status | undefined
  const overall = worst ?? "unknown"

  return (
    <Panel className="h-full">
      <PanelHeader
        title={t("title")}
        description={t("description")}
        icon={<HeartPulse />}
        iconTone="green"
        action={
          <Badge
            variant={
              overall === "healthy"
                ? "success"
                : overall === "onTarget"
                  ? "info"
                  : overall === "needsAttention"
                    ? "warning"
                    : overall === "critical"
                      ? "destructive"
                      : "muted"
            }
          >
            {t(`status.${overall}`)}
          </Badge>
        }
      />

      <div className="flex-1 space-y-4 px-4 py-4 sm:px-5">
        {items.map((item) => {
          const status = statusOf(item.value)
          const style = STATUS_STYLE[status]
          return (
            <div key={item.label}>
              <div className="flex items-center gap-2.5">
                <IconBadge icon={item.icon} tone={STATUS_TONE[status]} size="sm" />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">
                  {item.label}
                </span>
                <span className="metric shrink-0 text-[15px] text-foreground">
                  {item.value === null ? "—" : `${formatNumber(item.value, locale)}%`}
                </span>
              </div>
              <div className="meter mt-2">
                <span
                  className={style.bar}
                  style={{ width: item.value === null ? "0%" : `${Math.min(item.value, 100)}%` }}
                />
              </div>
              <p className={cn("mt-1.5 text-[11px] font-medium", style.text)}>{t(`status.${status}`)}</p>
            </div>
          )
        })}
      </div>

      {composite !== null && (
        <div className="strip flex flex-wrap items-center justify-between gap-2 border-t border-border-light px-4 py-3 text-[11px] text-muted-foreground sm:px-5">
          <span>{t("compositeCaption")}</span>
          <Badge variant="muted">
            {t("composite", { score: formatNumber(composite, locale) })}
          </Badge>
        </div>
      )}
    </Panel>
  )
}
