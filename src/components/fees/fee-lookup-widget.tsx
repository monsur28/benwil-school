"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { ArrowRight, Layers, Search, Sparkles, UserSearch, WalletCards } from "lucide-react"
import { Panel, PanelHeader } from "@/components/shared/panel"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/format"
import type { FeeStructureRow } from "@/lib/fees/get-fees"

interface FeeLookupWidgetProps {
  structures: FeeStructureRow[]
  paymentMethodsSummary: { method: string; count: number; totalAmount: number }[]
}

export function FeeLookupWidget({ structures, paymentMethodsSummary }: FeeLookupWidgetProps) {
  const t = useTranslations("fees")
  const tDash = useTranslations("fees.dashboard")
  const locale = useLocale()
  const router = useRouter()
  const [query, setQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/fees/student?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const totalPaymentsCount = paymentMethodsSummary.reduce((sum, item) => sum + item.count, 0)

  return (
    <div className="space-y-6">
      {/* Quick Student Fee Lookup Card */}
      <Panel tone="default" className="overflow-hidden">
        <PanelHeader
          title={tDash("quickSearch")}
          description={tDash("quickSearchDesc")}
          icon={<UserSearch />}
          iconTone="orange"
        />
        <div className="p-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tDash("quickSearchPlaceholder")}
                className="h-9 pl-9 text-xs"
              />
            </div>
            <Button type="submit" size="sm" className="h-9 gap-1 text-xs">
              {t("actions.search")}
            </Button>
          </form>
          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Find by name, admission no. or UID</span>
            <Link
              href="/fees/student"
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              Browse all
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </Panel>

      {/* Active Fee Structures Snapshot */}
      <Panel tone="default" className="overflow-hidden">
        <PanelHeader
          title={tDash("activeStructures")}
          description={tDash("activeStructuresDesc")}
          icon={<Layers />}
          iconTone="rose"
          href="/fees/structures"
          hrefLabel={tDash("manageStructures")}
        />
        <div className="divide-y divide-border-light">
          {structures.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              {t("list.emptyStructures")}
            </div>
          ) : (
            structures.slice(0, 4).map((structure) => (
              <div key={structure.id} className="flex items-center justify-between p-3.5 transition-colors hover:bg-muted/20">
                <div className="min-w-0 pr-2">
                  <p className="truncate text-xs font-semibold text-foreground">{structure.name}</p>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{structure.className}</span>
                    <span>·</span>
                    <Badge variant="outline" className="h-4 px-1.5 py-0 text-[10px] font-normal">
                      {t(`frequency.${structure.frequency}`)}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-foreground">
                    {formatCurrency(structure.amount, locale, "৳")}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Panel>

      {/* Payment Method Distribution */}
      {paymentMethodsSummary.length > 0 && (
        <Panel tone="default" className="overflow-hidden">
          <PanelHeader
            title={tDash("paymentMethods")}
            icon={<WalletCards />}
            iconTone="green"
          />
          <div className="space-y-3 p-4">
            {paymentMethodsSummary.map((item) => {
              const percent = totalPaymentsCount > 0 ? Math.round((item.count / totalPaymentsCount) * 100) : 0
              return (
                <div key={item.method} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{t(`method.${item.method}`)}</span>
                    <span className="font-mono text-muted-foreground">
                      {formatCurrency(item.totalAmount, locale, "৳")} ({percent}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>
      )}
    </div>
  )
}
