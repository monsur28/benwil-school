import { getTranslations } from "next-intl/server"
import { Award } from "lucide-react"
import type { StudentExamResultSummary } from "@/lib/results/get-results"
import { TintedPanel, TintedPanelHeader } from "@/components/shared/tinted-panel"

/**
 * The latest finalised result.
 *
 * Blue is the academic tint in this system, so results, report cards and
 * notices share it. The pass/fail verdict is the one place a second colour
 * is allowed in here — green for a pass, red for a fail — because that is
 * genuine status, not decoration.
 */
export async function StudentResultCard({
  summary,
  href,
}: {
  summary: StudentExamResultSummary | null
  href: string
}) {
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

  const statusClass =
    summary?.overallStatus === "PASS"
      ? "bg-success/15 text-success"
      : summary?.overallStatus === "FAIL"
        ? "bg-destructive/15 text-destructive"
        : "bg-card/70 text-surface-blue-foreground"

  return (
    <TintedPanel tint="blue" className="h-full">
      <TintedPanelHeader
        tint="blue"
        title={t("cards.latestResult")}
        icon={<Award />}
        href={href}
        hrefLabel={t("nav.results")}
      />

      <div className="flex flex-1 flex-col justify-between px-5 pb-5">
        {!summary ? (
          <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
            <Award className="size-6 text-surface-blue-foreground/40" strokeWidth={1.75} />
            <p className="mt-3 text-sm font-semibold text-surface-blue-foreground">
              {t("empty.noResultsTitle")}
            </p>
            <p className="mt-1 max-w-[22ch] text-[13px] text-surface-blue-foreground/75">
              {t("empty.noResults")}
            </p>
          </div>
        ) : (
          <>
            <div>
              <p className="truncate text-base font-bold leading-snug text-surface-blue-foreground">
                {summary.examName}
              </p>
              <p className="mt-0.5 truncate text-[13px] text-surface-blue-foreground/75">
                {summary.examTypeName}
              </p>
              {statusLabel && (
                <span
                  className={`mt-3 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${statusClass}`}
                >
                  {statusLabel}
                </span>
              )}
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-card/70 px-3 py-2.5">
                <dt className="text-[11px] font-semibold text-surface-blue-foreground/75">
                  {tResults("fields.percentage")}
                </dt>
                <dd className="metric mt-1 text-[1.6rem] text-surface-blue-foreground">
                  {summary.overallPercentage !== null ? `${summary.overallPercentage}%` : "—"}
                </dd>
              </div>
              <div className="rounded-xl bg-card/70 px-3 py-2.5">
                <dt className="text-[11px] font-semibold text-surface-blue-foreground/75">
                  {tResults("fields.gpa")}
                </dt>
                <dd className="metric mt-1 text-[1.6rem] text-surface-blue-foreground">
                  {summary.gpa !== null ? summary.gpa.toFixed(2) : "—"}
                </dd>
              </div>
            </dl>
          </>
        )}
      </div>
    </TintedPanel>
  )
}
