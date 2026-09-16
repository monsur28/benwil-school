import { getTranslations } from "next-intl/server"
import { Award } from "lucide-react"
import type { StudentExamResultSummary } from "@/lib/results/get-results"
import { Panel, PanelHeader } from "@/components/shared/panel"
import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"

export async function LatestResultCard({ summary }: { summary: StudentExamResultSummary | null }) {
  const [t, tResults] = await Promise.all([getTranslations("portal"), getTranslations("results")])

  const statusLabel = summary
    ? summary.overallStatus === "PASS"
      ? tResults("status.pass")
      : summary.overallStatus === "FAIL"
        ? tResults("status.fail")
        : summary.overallStatus === "INCOMPLETE"
          ? tResults("status.incomplete")
          : tResults("status.noResult")
    : null

  const statusTone =
    summary?.overallStatus === "PASS"
      ? "success"
      : summary?.overallStatus === "FAIL"
        ? "destructive"
        : "muted"

  return (
    <Panel className="h-full">
      <PanelHeader
        title={t("cards.latestResult")}
        description={summary ? `${summary.examName} · ${summary.examTypeName}` : undefined}
        action={summary && statusLabel ? <Badge variant={statusTone}>{statusLabel}</Badge> : undefined}
      />

      {!summary ? (
        <EmptyState inset icon={Award} title={t("empty.noResultsTitle")} description={t("empty.noResults")} />
      ) : (
        <div className="mt-auto grid grid-cols-2 divide-x divide-border-light">
          <div className="px-4 py-5 sm:px-5">
            <span className="eyebrow block">{tResults("fields.percentage")}</span>
            <span className="metric mt-2 block text-[2rem] text-foreground">
              {summary.overallPercentage !== null ? `${summary.overallPercentage}%` : "—"}
            </span>
          </div>
          <div className="px-4 py-5 sm:px-5">
            <span className="eyebrow block">{tResults("fields.gpa")}</span>
            <span className="metric mt-2 block text-[2rem] text-foreground">
              {summary.gpa !== null ? summary.gpa.toFixed(2) : "—"}
            </span>
          </div>
        </div>
      )}
    </Panel>
  )
}
