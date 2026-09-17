"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { AlertCircle, ChevronRight, Layers, Receipt, TrendingUp, WalletCards } from "lucide-react"
import { IconBadge } from "@/components/ui/icon-badge"

import { cn } from "cn"

export function FeesQuickActions() {
  const t = useTranslations("fees.dashboard")

  const actions = [
    {
      href: "/fees/student",
      label: t("collectFee"),
      description: t("collectFeeDesc"),
      icon: <WalletCards />,
      tone: "blue" as const,
    },
    {
      href: "/fees/structures",
      label: t("assignFees"),
      description: t("assignFeesDesc"),
      icon: <Layers />,
      tone: "rose" as const,
    },
    {
      href: "/fees/structures",
      label: t("feeStructures"),
      description: t("feeStructuresDesc"),
      icon: <Receipt />,
      tone: "orange" as const,
    },
    {
      href: "/fees/reports/outstanding",
      label: t("outstandingReport"),
      description: t("outstandingReportDesc"),
      icon: <AlertCircle />,
      tone: "amber" as const,
    },
    {
      href: "/fees/reports/collections",
      label: t("collectionsReport"),
      description: t("collectionsReportDesc"),
      icon: <TrendingUp />,
      tone: "green" as const,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {actions.map((action, index) => (
        <Link
          key={action.href + action.label}
          href={action.href}
          className={cn(
            "group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/70 bg-card p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-xs",
            index === 4 && "col-span-2 sm:col-span-1"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <IconBadge tone={action.tone} size="md" className="transition-transform duration-200 group-hover:scale-105">
              {action.icon}
            </IconBadge>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-foreground" />
          </div>
          <div className="mt-3 min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground group-hover:text-primary">
              {action.label}
            </span>
            <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
              {action.description}
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
