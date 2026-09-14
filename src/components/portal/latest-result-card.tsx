import { getTranslations } from "next-intl/server"
import type { StudentExamResultSummary } from "@/lib/results/get-results"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export async function LatestResultCard({ summary }: { summary: StudentExamResultSummary | null }) {
  const t = await getTranslations("portal")
  const tResults = await getTranslations("results")

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("cards.latestResult")}</CardTitle>
      </CardHeader>
      <CardContent>
        {!summary ? (
          <p className="text-sm text-muted-foreground">{t("empty.noResults")}</p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {summary.examName} <span className="text-muted-foreground">({summary.examTypeName})</span>
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span>
                <span className="text-muted-foreground">{tResults("fields.percentage")}: </span>
                <span className="font-semibold">
                  {summary.overallPercentage !== null ? `${summary.overallPercentage}%` : "—"}
                </span>
              </span>
              <span>
                <span className="text-muted-foreground">{tResults("fields.gpa")}: </span>
                <span className="font-semibold">{summary.gpa !== null ? summary.gpa.toFixed(2) : "—"}</span>
              </span>
              <span>
                <span className="text-muted-foreground">{tResults("fields.result")}: </span>
                <span className="font-semibold">
                  {summary.overallStatus === "PASS" && tResults("status.pass")}
                  {summary.overallStatus === "FAIL" && tResults("status.fail")}
                  {summary.overallStatus === "INCOMPLETE" && tResults("status.incomplete")}
                  {summary.overallStatus === "NO_RESULT" && tResults("status.noResult")}
                </span>
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
