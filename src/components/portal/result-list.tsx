import Link from "next/link"
import { getTranslations } from "next-intl/server"
import type { StudentExamResultSummary } from "@/lib/results/get-results"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { FileText, ChevronRight } from "lucide-react"

// A card list rather than a wide admin-style table - the spec calls for
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
    <div className="space-y-2">
      {summaries.map((summary) => (
        <Button
          key={summary.examId}
          nativeButton={false}
          variant="outline"
          className="h-auto w-full justify-between gap-3 px-4 py-3 text-left"
          render={<Link href={buildHref(summary.examId)} />}
        >
          <div className="min-w-0 space-y-1">
            <p className="truncate text-sm font-medium">
              {summary.examName} <span className="text-muted-foreground">({summary.examTypeName})</span>
            </p>
            <p className="text-xs text-muted-foreground">{summary.academicYearName}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span>
                {tResults("fields.percentage")}:{" "}
                <span className="font-medium text-foreground">
                  {summary.overallPercentage !== null ? `${summary.overallPercentage}%` : "—"}
                </span>
              </span>
              <span>
                {tResults("fields.gpa")}:{" "}
                <span className="font-medium text-foreground">
                  {summary.gpa !== null ? summary.gpa.toFixed(2) : "—"}
                </span>
              </span>
              <span>
                {tResults("fields.result")}:{" "}
                <span className="font-medium text-foreground">
                  {summary.overallStatus === "PASS" && tResults("status.pass")}
                  {summary.overallStatus === "FAIL" && tResults("status.fail")}
                  {summary.overallStatus === "INCOMPLETE" && tResults("status.incomplete")}
                  {summary.overallStatus === "NO_RESULT" && tResults("status.noResult")}
                </span>
              </span>
            </div>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      ))}
    </div>
  )
}
