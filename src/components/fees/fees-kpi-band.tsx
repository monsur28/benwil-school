"use client"

import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { AlertCircle, ArrowUpRight, CheckCircle2, Clock, Users, WalletCards } from "lucide-react"
import { cn } from "cn"
import { formatCurrency, formatNumber } from "@/lib/format"
import { IconBadge, type IconBadgeTone } from "@/components/ui/icon-badge"

interface FeesKpiBandProps {
  summary: {
    totalOutstanding: number
    paymentsTodayAmount: number
    paymentsTodayCount: number
    paymentsThisMonthAmount: number
    studentsWithOutstandingCount: number
  }
}

export function FeesKpiBand({ summary }: FeesKpiBandProps) {
  const t = useTranslations("fees.dashboard")
  const locale = useLocale()

  const tiles = [
    {
      label: t("totalOutstanding"),
      value: formatCurrency(summary.totalOutstanding, locale, "৳"),
      detail: summary.totalOutstanding > 0 ? t("pendingFollowup") : t("reconciled"),
      footer: summary.totalOutstanding > 0 ? "Requires settlement" : "All accounts balanced",
      icon: AlertCircle,
      tone: (summary.totalOutstanding > 0 ? "rose" : "green") as IconBadgeTone,
      accent: summary.totalOutstanding > 0 ? "bg-danger" : "bg-success",
      valueColor: summary.totalOutstanding > 0 ? "text-danger" : "text-brand-navy",
      href: "/fees/reports/outstanding",
      isAllGood: summary.totalOutstanding === 0,
    },
    {
      label: t("paymentsToday"),
      value: formatCurrency(summary.paymentsTodayAmount, locale, "৳"),
      detail: t("counterCollection"),
      footer: t("receiptsCount", { count: summary.paymentsTodayCount }),
      icon: CheckCircle2,
      tone: "green" as IconBadgeTone,
      accent: "bg-success",
      valueColor: "text-success",
      href: "/fees/payments",
      isAllGood: true,
    },
    {
      label: t("paymentsThisMonth"),
      value: formatCurrency(summary.paymentsThisMonthAmount, locale, "৳"),
      detail: t("currentBillingCycle"),
      footer: t("monthlyCollection"),
      icon: WalletCards,
      tone: "blue" as IconBadgeTone,
      accent: "bg-dashboard-blue",
      valueColor: "text-brand-navy",
      href: "/fees/reports/collections",
      isAllGood: true,
    },
    {
      label: t("studentsWithOutstanding"),
      value: formatNumber(summary.studentsWithOutstandingCount, locale),
      detail: summary.studentsWithOutstandingCount > 0 ? t("duesPending") : t("allAccountsClear"),
      footer: summary.studentsWithOutstandingCount > 0 ? `${summary.studentsWithOutstandingCount} student accounts` : "Zero pending balances",
      icon: Users,
      tone: (summary.studentsWithOutstandingCount > 0 ? "amber" : "purple") as IconBadgeTone,
      accent: summary.studentsWithOutstandingCount > 0 ? "bg-warning" : "bg-dashboard-purple",
      valueColor: "text-brand-navy",
      href: "/fees/reports/outstanding",
      isAllGood: summary.studentsWithOutstandingCount === 0,
    },
  ]

  return (
    <div className="panel grid divide-y divide-border-light overflow-hidden sm:grid-cols-2 sm:divide-x lg:grid-cols-4 lg:divide-y-0">
      {tiles.map((tile) => {
        const Icon = tile.icon
        return (
          <Link
            key={tile.label}
            href={tile.href}
            className="group relative flex flex-col justify-between bg-card px-4 py-5 transition-colors hover:bg-subtle sm:px-5"
          >
            <span aria-hidden="true" className={cn("absolute inset-x-0 top-0 h-[3px]", tile.accent)} />

            <div>
              <div className="flex items-start justify-between gap-3">
                <IconBadge icon={Icon} tone={tile.tone} size="lg" />
                <ArrowUpRight className="size-4 shrink-0 text-transparent transition-colors group-hover:text-muted-foreground" />
              </div>

              <p className="eyebrow mt-4 truncate">{tile.label}</p>
              <p className={cn("metric mt-1.5 truncate text-[1.85rem] font-bold tracking-tight", tile.valueColor)}>
                {tile.value}
              </p>
              <p className="mt-1 truncate text-[13px] text-muted-foreground">{tile.detail}</p>
            </div>

            <p className="mt-3.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              {tile.isAllGood ? (
                <CheckCircle2 className="size-3.5 shrink-0 text-success" />
              ) : (
                <Clock className="size-3.5 shrink-0 text-warning" />
              )}
              <span className="truncate">{tile.footer}</span>
            </p>
          </Link>
        )
      })}
    </div>
  )
}
