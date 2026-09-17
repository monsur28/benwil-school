"use client"

import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { ArrowRight, BarChart3, TrendingUp } from "lucide-react"
import { Panel, PanelHeader } from "@/components/shared/panel"
import { formatCurrency, formatNumber } from "@/lib/format"
import type { MonthlyCollectionPoint } from "@/lib/fees/get-fees"

interface FeeCollectionTrendProps {
  monthlyData: MonthlyCollectionPoint[]
}

export function FeeCollectionTrend({ monthlyData }: FeeCollectionTrendProps) {
  const t = useTranslations("fees.dashboard")
  const locale = useLocale()

  const maxAmount = Math.max(...monthlyData.map((d) => d.amount), 1000)
  const total6Mo = monthlyData.reduce((acc, curr) => acc + curr.amount, 0)
  const avgMonthly = total6Mo > 0 ? Math.round(total6Mo / monthlyData.length) : 0

  return (
    <Panel tone="default" className="overflow-hidden">
      <PanelHeader
        title={t("monthlyTrend")}
        description={t("monthlyTrendDesc")}
        icon={<BarChart3 />}
        iconTone="green"
        href="/fees/reports/collections"
        hrefLabel={t("collectionsReport")}
      />

      <div className="p-5">
        {/* Metric summary banner */}
        <div className="mb-6 grid grid-cols-2 gap-4 rounded-xl border border-border/60 bg-muted/20 p-3.5">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("sixMonthTotal")}
            </span>
            <p className="mt-1 font-mono text-lg font-bold text-foreground">
              {formatCurrency(total6Mo, locale, "৳")}
            </p>
          </div>
          <div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("avgMonthly")}
            </span>
            <p className="mt-1 font-mono text-lg font-bold text-success">
              {formatCurrency(avgMonthly, locale, "৳")}
            </p>
          </div>
        </div>

        {/* CSS-based Bar Chart for high performance and zero hydration layout shifts */}
        <div className="flex h-36 items-end gap-2 sm:gap-4">
          {monthlyData.map((point) => {
            const heightPercent = Math.max(Math.round((point.amount / maxAmount) * 100), point.amount > 0 ? 8 : 3)
            const hasAmount = point.amount > 0

            return (
              <div key={point.month} className="group relative flex flex-1 flex-col items-center justify-end h-full">
                {/* Floating tooltip on hover */}
                <div className="pointer-events-none absolute -top-8 z-10 hidden whitespace-nowrap rounded-md bg-brand-navy px-2 py-1 text-[11px] font-medium text-white shadow-md group-hover:block">
                  {formatCurrency(point.amount, locale, "৳")}
                </div>

                {/* Amount display above bar on desktop */}
                {hasAmount && (
                  <span className="mb-1 hidden font-mono text-[10px] font-semibold text-foreground sm:block">
                    {formatNumber(point.amount, locale)}
                  </span>
                )}

                {/* Bar */}
                <div
                  className={`w-full max-w-[42px] rounded-t-md transition-all duration-300 ${
                    hasAmount
                      ? "bg-gradient-to-t from-primary/80 to-primary group-hover:from-primary group-hover:to-primary/90"
                      : "bg-muted/40"
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />

                {/* Month label */}
                <span className="mt-2 text-[11px] font-medium text-muted-foreground group-hover:text-foreground">
                  {point.month}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </Panel>
  )
}
