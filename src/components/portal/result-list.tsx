import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { FileText, ChevronRight } from "lucide-react"
import type { StudentExamResultSummary } from "@/lib/results/get-results"
import { EmptyState } from "@/components/shared/empty-state"
import { Panel } from "@/components/shared/panel"
import { Badge } from "@/components/ui/badge"

// A list rather than a wide admin-style table - the spec calls for
// cards/lists on mobile, and the portal never needs the admin table's
// extra columns (roll, actions, etc).
export async function ResultList({
  summaries,
  buildHref,
}: {
  summaries: StudentExamResultSummary[]
  buildHref: (examId: string) => string
}) {
  const [t, tResults] = await Promise.all([getTranslations("portal"), getTranslations("results")])

  if (summaries.length === 0) {
    return <EmptyState icon={FileText} title={t("empty.noResultsTitle")} description={t("empty.noResults")} />
  }

  return (
    <Panel>
      <ul className="divide-y divide-border-light">
        {summaries.map((summary) => {
          const statusLabel =
            summary.overallStatus === "PASS"
              ? tResults("status.pass")
              : summary.overallStatus === "FAIL"
                ? tResults("status.fail")
                : summary.overallStatus === "INCOMPLETE"
                  ? tResults("status.incomplete")
                  : tResults("status.noResult")
          const statusTone =
            summary.overallStatus === "PASS"
              ? "success"
              : summary.overallStatus === "FAIL"
                ? "destructive"
                : "muted"

          return (
            <li key={summary.examId}>
              <Link
                href={buildHref(summary.examId)}
                className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-subtle sm:px-5"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-semibold leading-snug text-foreground">
                      {summary.examName}
                    </span>
                    <Badge variant={statusTone}>{statusLabel}</Badge>
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {summary.examTypeName} · {summary.academicYearName}
                  </span>
                </span>

                {/* The two figures a family actually looks for, held right and
                    aligned so several exams can be compared down the column. */}
                <span className="flex shrink-0 gap-6">
                  <span className="text-right">
                    <span className="eyebrow block">{tResults("fields.percentage")}</span>
                    <span className="mt-0.5 block text-base font-bold tabular-nums text-foreground">
                      {summary.overallPercentage !== null ? `${summary.overallPercentage}%` : "—"}
                    </span>
                  </span>
                  <span className="hidden text-right sm:block">
                    <span className="eyebrow block">{tResults("fields.gpa")}</span>
                    <span className="mt-0.5 block text-base font-bold tabular-nums text-foreground">
                      {summary.gpa !== null ? summary.gpa.toFixed(2) : "—"}
                    </span>
                  </span>
                </span>

                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
