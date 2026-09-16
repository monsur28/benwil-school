"use client"

import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowUpRight, GraduationCap } from "lucide-react"
import { formatNumber } from "@/lib/format"

export interface ClassPerformance {
  className: string
  score: number
  benchmark: number
  grade: string
}

interface AcademicPerformanceCardProps {
  performanceData?: ClassPerformance[]
}

const DEFAULT_PERFORMANCE: ClassPerformance[] = [
  { className: "Class 6", score: 78, benchmark: 75, grade: "A" },
  { className: "Class 7", score: 84, benchmark: 75, grade: "A+" },
  { className: "Class 8", score: 81, benchmark: 75, grade: "A" },
  { className: "Class 9", score: 87, benchmark: 75, grade: "A+" },
  { className: "Class 10", score: 85, benchmark: 75, grade: "A+" },
]

export function AcademicPerformanceCard({
  performanceData,
}: AcademicPerformanceCardProps) {
  // No finalized exam yet (or no caller-supplied data) - fall back to demo
  // data, but say so, rather than presenting it with the same weight as a
  // real result.
  const isSample = !performanceData || performanceData.length === 0
  const data = isSample ? DEFAULT_PERFORMANCE : performanceData
  const t = useTranslations("dashboard.admin.academicPerformance")
  const locale = useLocale()

  return (
    <Card className="flex flex-col justify-between rounded-xl border border-border/60 bg-card p-4 shadow-xs">
      <CardHeader className="p-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-dashboard-purple-light text-dashboard-purple">
              <GraduationCap className="size-4" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-1.5 text-base font-semibold tracking-tight text-foreground">
                {t("title")}
                {isSample && (
                  <span className="text-[9px] font-semibold tracking-wide text-muted-foreground/70 uppercase">
                    (sample)
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {t("description")}
              </CardDescription>
            </div>
          </div>

          <Link
            href="/results"
            className="group flex items-center gap-1 text-xs font-semibold text-brand-navy hover:underline"
          >
            <span>{t("results")}</span>
            <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </CardHeader>

      {/* Horizontal Bar Chart for Class Performance */}
      <div className="my-auto h-52 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-border/40" />
            <XAxis
              type="number"
              domain={[60, 100]}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "currentColor", fontSize: 11 }}
              className="text-muted-foreground"
              unit="%"
            />
            <YAxis
              type="category"
              dataKey="className"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "currentColor", fontSize: 11 }}
              className="text-muted-foreground font-medium"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null
                const d = payload[0].payload as ClassPerformance
                return (
                  <div className="rounded-xl border border-border bg-card p-2.5 shadow-md">
                    <p className="text-xs font-semibold text-foreground">{d.className}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">{t("avgScore")}</span>
                      <span className="font-mono font-bold text-dashboard-purple">
                        {formatNumber(d.score, locale)}% ({d.grade})
                      </span>
                    </div>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {t("benchmarkTarget", { benchmark: formatNumber(d.benchmark, locale) })}
                    </p>
                  </div>
                )
              }}
            />
            <Bar dataKey="score" fill="var(--color-dashboard-purple)" radius={[0, 4, 4, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Benchmark Notes */}
      <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-dashboard-purple" />
          {t("passingBenchmark")}
        </span>
        <span className="font-mono font-medium text-foreground">{t("highestClass")}</span>
      </div>
    </Card>
  )
}
