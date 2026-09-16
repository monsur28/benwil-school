"use client"

import { useLocale, useTranslations } from "next-intl"
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { Panel, PanelHeader } from "@/components/shared/panel"
import { CheckCircle2, Clock } from "lucide-react"
import { formatLakh, formatNumber } from "@/lib/format"

export interface MonthlyCollection {
  month: string
  amount: number
  target?: number
}

interface FeeAnalyticsCardProps {
  totalCollected: number
  targetAmount: number
  pendingAmount: number
  collectionRate: number
  monthlyData?: MonthlyCollection[]
  currencySymbol?: string
}

const DEFAULT_MONTHLY: MonthlyCollection[] = [
  { month: "Jan", amount: 42, target: 50 },
  { month: "Feb", amount: 48, target: 50 },
  { month: "Mar", amount: 45, target: 50 },
  { month: "Apr", amount: 52, target: 55 },
  { month: "May", amount: 49, target: 55 },
  { month: "Jun", amount: 54, target: 55 },
  { month: "Jul", amount: 46, target: 55 },
  { month: "Aug", amount: 58, target: 60 },
  { month: "Sep", amount: 48.5, target: 58.9 },
]

export function FeeAnalyticsCard({
  totalCollected = 4850000,
  targetAmount = 5890000,
  pendingAmount = 1040000,
  collectionRate = 82.4,
  monthlyData = DEFAULT_MONTHLY,
  currencySymbol = "\u09F3",
}: FeeAnalyticsCardProps) {
  const t = useTranslations("dashboard.admin.feeAnalytics")
  const locale = useLocale()
  const lakhSuffix = t("lakhSuffix")

  return (
    <Panel>
      <PanelHeader
        title={t("title")}
        description={t("description")}
        href="/fees"
        hrefLabel={t("billingDesk")}
      />

      {/* The three figures that matter, as a divided band — the same visual
          grammar as the KPI row at the top of the dashboard, so finance reads
          as "more of the same kind of fact", not as a new dialect. */}
      <div className="grid divide-y divide-border-light border-b border-border-light sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="px-4 py-4 sm:px-5">
          <span className="eyebrow">{t("collected")}</span>
          <p className="metric mt-2 text-xl text-success">
            {currencySymbol} {formatLakh(totalCollected, locale, lakhSuffix)}
          </p>
          <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-success">
            <CheckCircle2 className="size-3" />
            {t("reconciled")}
          </span>
        </div>
        <div className="px-4 py-4 sm:px-5">
          <span className="eyebrow">{t("target")}</span>
          <p className="metric mt-2 text-xl text-foreground">
            {currencySymbol} {formatLakh(targetAmount, locale, lakhSuffix)}
          </p>
          <span className="mt-1.5 block text-[11px] text-muted-foreground">{t("sessionTotal")}</span>
        </div>
        <div className="px-4 py-4 sm:px-5">
          <span className="eyebrow">{t("pending")}</span>
          <p className="metric mt-2 text-xl text-warning">
            {currencySymbol} {formatLakh(pendingAmount, locale, lakhSuffix)}
          </p>
          <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-warning">
            <Clock className="size-3" />
            {t("invoicesActive")}
          </span>
        </div>
      </div>

      <div className="border-b border-border-light px-4 py-4 sm:px-5">
        <div className="flex items-baseline justify-between gap-3 text-[13px]">
          <span className="font-medium text-muted-foreground">{t("collectionPace")}</span>
          <span className="font-semibold tabular-nums text-foreground">
            {t("ofTarget", { percent: formatNumber(collectionRate, locale) })}
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-success"
            style={{ width: `${Math.min(collectionRate, 100)}%` }}
          />
        </div>
      </div>

      <div className="px-4 pb-4 pt-4 sm:px-5">
        <div className="flex items-baseline justify-between pb-3 text-xs">
          <span className="eyebrow">{t("monthlyTrend")}</span>
          <span className="text-[11px] tabular-nums text-muted-foreground">{t("monthsRange")}</span>
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
                      <p className="text-xs font-semibold text-foreground">{d.month} 2026</p>
                      <p className="text-xs tabular-nums text-dashboard-blue">
                        {t("intake")} {currencySymbol}{formatNumber(d.amount, locale)}{lakhSuffix}
                      </p>
                      {d.target !== undefined && (
                        <p className="text-[11px] tabular-nums text-muted-foreground">
                          {t("targetLabel")} {currencySymbol}{formatNumber(d.target, locale)}{lakhSuffix}
                        </p>
                      )}
                    </div>
                  )
                }}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={32}>
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
    </Panel>
  )
}
