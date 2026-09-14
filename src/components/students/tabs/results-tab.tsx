import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { FileText } from "lucide-react"
import { getStudentResultSummaries } from "@/lib/results/get-results"
import { EmptyState } from "@/components/shared/empty-state"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

export async function ResultsTab({ studentId, schoolId, classId }: { studentId: string; schoolId: string; classId: string }) {
  const [t, tResults] = await Promise.all([getTranslations("students.results"), getTranslations("results")])

  const summaries = await getStudentResultSummaries({ schoolId, studentId, classId })

  if (summaries.length === 0) {
    return <EmptyState icon={FileText} title={t("empty.title")} description={t("empty.description")} />
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tResults("fields.exam")}</TableHead>
            <TableHead>{tResults("fields.academicYear")}</TableHead>
            <TableHead>{tResults("fields.percentage")}</TableHead>
            <TableHead>{tResults("fields.gpa")}</TableHead>
            <TableHead>{tResults("fields.result")}</TableHead>
            <TableHead className="text-right">{tResults("actions.label")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {summaries.map((summary) => (
            <TableRow key={summary.examId}>
              <TableCell>
                {summary.examName} <span className="text-xs text-muted-foreground">({summary.examTypeName})</span>
              </TableCell>
              <TableCell>{summary.academicYearName}</TableCell>
              <TableCell>{summary.overallPercentage !== null ? `${summary.overallPercentage}%` : "—"}</TableCell>
              <TableCell>{summary.gpa !== null ? summary.gpa.toFixed(2) : "—"}</TableCell>
              <TableCell>
                {summary.overallStatus === "PASS" && tResults("status.pass")}
                {summary.overallStatus === "FAIL" && tResults("status.fail")}
                {summary.overallStatus === "INCOMPLETE" && tResults("status.incomplete")}
                {summary.overallStatus === "NO_RESULT" && tResults("status.noResult")}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  nativeButton={false}
                  variant="ghost"
                  size="sm"
                  render={<Link href={`/results/${summary.examId}/student/${studentId}`} />}
                >
                  {tResults("actions.viewResult")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
