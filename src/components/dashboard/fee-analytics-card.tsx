"use client"

import { useLocale, useTranslations } from "next-intl"
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { Panel, PanelHeader } from "@/components/shared/panel"
import { ChartNoAxesColumn, CircleCheck, Clock, Receipt, TrendingDown, TrendingUp, WalletCards } from "lucide-react"
import { cn } from "cn"
import { formatLakh, formatNumber } from "@/lib/format"
import { IconBadge } from "@/components/ui/icon-badge"

export interface MonthlyCollection {
  month: string
  amount: number
}

interface FeeAnalyticsCardProps {
  totalCollected: number
  targetAmount: number
  pendingAmount: number
  collectionRate: number
  /** Real trailing months, in lakhs. May be all zeroes for a young school. */
  monthlyData: MonthlyCollection[]
  /** Label for the months the chart actually covers — computed, not copy. */
  monthsRangeLabel: string
  /** Percent change against last month. Null when there is no base month. */
  monthDelta: number | null
  currencySymbol?: string
}

export function FeeAnalyticsCard({
  totalCollected,
  targetAmount,
  pendingAmount,
  collectionRate,
  monthlyData,
  monthsRangeLabel,
  monthDelta,
  currencySymbol = "৳",
}: FeeAnalyticsCardProps) {
  const t = useTranslations("dashboard.admin.feeAnalytics")
  const locale = useLocale()
  const lakhSuffix = t("lakhSuffix")
  const onTrack = collectionRate >= 75

  // A bar chart of one month, or of nine zeroes, is a picture of nothing. It
  // takes two months that actually took money for the shape to mean anything.
  const monthsWithIntake = monthlyData.filter((point) => point.amount > 0).length
  const hasTrend = monthsWithIntake >= 2

  return (
    <Panel>
      <PanelHeader
        title={t("title")}
        description={t("description")}
        icon={<WalletCards />}
        iconTone="orange"
        href="/fees"
        hrefLabel={t("billingDesk")}
      />

      {/* The three figures that matter, as a divided band — the same visual
          grammar as the KPI row at the top of the dashboard, so finance reads
          as "more of the same kind of fact", not as a new dialect. Each cell
          states its role twice: an icon in its tone, and the figure in that
          same tone — money in (green), money assigned (blue), money late
          (amber). */}
      <div className="grid divide-y divide-border-light border-b border-border-light sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="flex items-start gap-3 px-4 py-4 sm:px-5">
          <IconBadge icon={CircleCheck} tone="green" size="md" />
          <span className="min-w-0">
            <span className="eyebrow block truncate">{t("collected")}</span>
            <p className="metric mt-1.5 truncate text-xl text-success">
              {currencySymbol} {formatLakh(totalCollected, locale, lakhSuffix)}
            </p>
            <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-success">
              <CircleCheck className="size-3 shrink-0" />
              {t("reconciled")}
            </span>
          </span>
        </div>
        <div className="flex items-start gap-3 px-4 py-4 sm:px-5">
          <IconBadge icon={Receipt} tone="blue" size="md" />
          <span className="min-w-0">
            <span className="eyebrow block truncate">{t("target")}</span>
            <p className="metric mt-1.5 truncate text-xl text-foreground">
              {currencySymbol} {formatLakh(targetAmount, locale, lakhSuffix)}
            </p>
            <span className="mt-1 block truncate text-[11px] text-muted-foreground">{t("sessionTotal")}</span>
          </span>
        </div>
        <div className="flex items-start gap-3 px-4 py-4 sm:px-5">
          <IconBadge
            icon={pendingAmount > 0 ? Clock : CircleCheck}
            tone={pendingAmount > 0 ? "orange" : "green"}
            size="md"
          />
          <span className="min-w-0">
            <span className="eyebrow block truncate">{t("pending")}</span>
            <p
              className={cn(
                "metric mt-1.5 truncate text-xl",
                pendingAmount > 0 ? "text-warning" : "text-success"
              )}
            >
              {currencySymbol} {formatLakh(pendingAmount, locale, lakhSuffix)}
            </p>
            {pendingAmount > 0 ? (
              <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-warning">
                <Clock className="size-3 shrink-0" />
                {t("invoicesActive")}
              </span>
            ) : (
              <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-success">
                <CircleCheck className="size-3 shrink-0" />
                {t("allCleared")}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Collection pace is the single number the billing desk is judged on,
          so it gets the panel's one tinted feature block — green once intake
          is on track for the term, amber while it is still behind. */}
      <div className="border-b border-border-light px-4 py-4 sm:px-5">
        <div
          className={cn(
            "rounded-xl border px-3.5 py-3",
            onTrack
              ? "border-surface-green-border bg-surface-green"
              : "border-surface-orange-border bg-surface-orange"
          )}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-[13px]">
            <span
              className={cn(
                "font-semibold",
                onTrack ? "text-surface-green-foreground" : "text-surface-orange-foreground"
              )}
            >
              {t("collectionPace")}
            </span>
            <span
              className={cn(
                "metric text-base",
                onTrack ? "text-surface-green-foreground" : "text-surface-orange-foreground"
              )}
            >
              {t("ofTarget", { percent: formatNumber(collectionRate, locale) })}
            </span>
          </div>
          <div className="meter mt-2.5 bg-card/60">
            <span
              className={onTrack ? "bg-success" : "bg-warning"}
              style={{ width: `${Math.min(collectionRate, 100)}%` }}
            />
          </div>
          {monthDelta !== null && (
            <p
              className={cn(
                "mt-2.5 flex items-center gap-1.5 text-[11px] font-medium",
                monthDelta >= 0 ? "text-success" : "text-danger"
              )}
            >
              {monthDelta >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {t("vsLastMonth", {
                percent: `${monthDelta >= 0 ? "+" : "−"}${formatNumber(Math.abs(monthDelta), locale)}`,
              })}
            </p>
          )}
        </div>
      </div>

      {hasTrend ? (
        <div className="px-4 pb-4 pt-4 sm:px-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3 text-xs">
            <span className="eyebrow">{t("monthlyTrend")}</span>
            <span className="text-[11px] tabular-nums text-muted-foreground">{monthsRangeLabel}</span>
          </div>

          <div className="h-40 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "currentColor", fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "currentColor", fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null
                    const d = payload[0].payload as MonthlyCollection
                    return (
                      <div className="rounded-xl border border-border bg-popover p-3 shadow-pop">
                        <p className="text-xs font-semibold text-foreground">{d.month}</p>
                        <p className="text-xs tabular-nums text-dashboard-blue">
                          {t("intake")} {currencySymbol}{formatNumber(d.amount, locale)}{lakhSuffix}
                        </p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={32} isAnimationActive={false}>
                  {/* Current month highlighted in the brand accent (design.md §13) */}
                  {monthlyData.map((point, index) => (
                    <Cell
                      key={point.month}
                      fill={index === monthlyData.length - 1 ? "var(--color-primary)" : "var(--color-dashboard-blue)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        // Better an honest three lines than a tall empty axis pretending to be
        // analysis.
        <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
          <IconBadge icon={ChartNoAxesColumn} tone="muted" size="md" />
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-foreground">{t("noTrendTitle")}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("noTrendDetail")}</p>
          </div>
        </div>
      )}
    </Panel>
  )
}
