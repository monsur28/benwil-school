"use client"

import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowUpRight, CheckCircle2, Clock } from "lucide-react"
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
  currencySymbol = "৳",
}: FeeAnalyticsCardProps) {
  const t = useTranslations("dashboard.admin.feeAnalytics")
  const locale = useLocale()
  const lakhSuffix = t("lakhSuffix")

  return (
    <Card className="flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-5 shadow-xs">
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight text-foreground">
              {t("title")}
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {t("description")}
            </CardDescription>
          </div>

          <Link
            href="/fees"
            className="group flex items-center gap-1 text-xs font-semibold text-brand-navy hover:underline"
          >
            <span>{t("billingDesk")}</span>
            <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </CardHeader>

      {/* Progress & Quick Stats Grid */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">{t("collectionPace")}</span>
            <span className="font-mono font-bold text-foreground">
              {t("ofTarget", { percent: formatNumber(collectionRate, locale) })}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-warning to-success transition-all duration-500"
              style={{ width: `${Math.min(collectionRate, 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="rounded-xl border border-border/50 bg-muted/20 p-2.5">
            <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
              {t("collected")}
            </span>
            <p className="font-mono text-sm font-bold text-success sm:text-base">
              {currencySymbol} {formatLakh(totalCollected, locale, lakhSuffix)}
            </p>
            <span className="inline-flex items-center gap-0.5 text-[10px] text-success">
              <CheckCircle2 className="size-2.5" />
              {t("reconciled")}
            </span>
          </div>

          <div className="rounded-xl border border-border/50 bg-muted/20 p-2.5">
            <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
              {t("target")}
            </span>
            <p className="font-mono text-sm font-bold text-foreground sm:text-base">
              {currencySymbol} {formatLakh(targetAmount, locale, lakhSuffix)}
            </p>
            <span className="text-[10px] text-muted-foreground">
              {t("sessionTotal")}
            </span>
          </div>

          <div className="rounded-xl border border-border/50 bg-muted/20 p-2.5">
            <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
              {t("pending")}
            </span>
            <p className="font-mono text-sm font-bold text-warning sm:text-base">
              {currencySymbol} {formatLakh(pendingAmount, locale, lakhSuffix)}
            </p>
            <span className="inline-flex items-center gap-0.5 text-[10px] text-warning">
              <Clock className="size-2.5" />
              {t("invoicesActive")}
            </span>
          </div>
        </div>
      </div>

      {/* Monthly Cashflow Bar Chart */}
      <div className="mt-4 pt-3 border-t border-border/40">
        <div className="flex items-center justify-between pb-2 text-xs">
          <span className="font-medium text-muted-foreground">{t("monthlyTrend")}</span>
          <span className="font-mono text-[11px] text-muted-foreground">{t("monthsRange")}</span>
        </div>

        <div className="h-44 w-full">
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
                    <div className="rounded-xl border border-border bg-card p-2.5 shadow-md">
                      <p className="text-xs font-semibold text-foreground">{d.month} 2026</p>
                      <p className="font-mono text-xs text-dashboard-blue">
                        {t("intake")} {currencySymbol}{formatNumber(d.amount, locale)}{lakhSuffix}
                      </p>
                      {d.target !== undefined && (
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {t("targetLabel")} {currencySymbol}{formatNumber(d.target, locale)}{lakhSuffix}
                        </p>
                      )}
                    </div>
                  )
                }}
              />
              <Bar dataKey="amount" fill="var(--color-dashboard-blue)" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  )
}
