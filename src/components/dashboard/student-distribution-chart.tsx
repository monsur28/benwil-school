"use client"

import { useLocale, useTranslations } from "next-intl"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatNumber } from "@/lib/format"

export interface StudentDistributionItem {
  name: string
  count: number
  percent: number
  color: string
}

interface StudentDistributionProps {
  totalStudents: number
  distribution?: StudentDistributionItem[]
}

const DEFAULT_DISTRIBUTION: StudentDistributionItem[] = [
  { name: "Primary (1–5)", count: 812, percent: 65, color: "var(--color-dashboard-purple)" },
  { name: "Secondary (6–10)", count: 436, percent: 35, color: "var(--color-dashboard-blue)" },
]

export function StudentDistributionChart({
  totalStudents,
  distribution = DEFAULT_DISTRIBUTION,
}: StudentDistributionProps) {
  const t = useTranslations("dashboard.admin.distribution")
  const locale = useLocale()

  const resolveItemName = (name: string) => {
    if (name === "Primary (1–5)") return t("primaryWing")
    if (name === "Secondary (6–10)") return t("secondaryWing")
    return name
  }

  return (
    <Card className="flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-5 shadow-xs">
      <CardHeader className="p-0 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold tracking-tight text-foreground">
            {t("title")}
          </CardTitle>
          <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
            {t("badge")}
          </span>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          {t("description")}
        </CardDescription>
      </CardHeader>

      {/* Donut Chart with Centered Total */}
      <div className="relative my-auto flex h-52 w-full items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null
                const data = payload[0].payload as StudentDistributionItem
                return (
                  <div className="rounded-xl border border-border bg-card p-2.5 shadow-md">
                    <p className="text-xs font-semibold text-foreground">{resolveItemName(data.name)}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {t("studentsCount", {
                        count: formatNumber(data.count, locale),
                        percent: formatNumber(data.percent, locale),
                      })}
                    </p>
                  </div>
                )
              }}
            />
            <Pie
              data={distribution}
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={76}
              paddingAngle={4}
              dataKey="count"
            >
              {distribution.map((entry) => (
                <Cell key={entry.name} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Label inside Donut */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-2xl font-bold tracking-tight text-foreground">
            {formatNumber(totalStudents, locale)}
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">
            {t("totalStudents")}
          </span>
        </div>
      </div>

      {/* Clean Legend */}
      <div className="mt-2 space-y-2 border-t border-border/40 pt-3">
        {distribution.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-muted-foreground">{resolveItemName(item.name)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-medium text-foreground">{formatNumber(item.count, locale)}</span>
              <span className="font-mono text-[11px] text-muted-foreground">({formatNumber(item.percent, locale)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

