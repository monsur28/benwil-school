import { getTranslations } from "next-intl/server"
import type { StudentExamResult } from "@/lib/results/calculate-result"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

// The subject-by-subject breakdown + summary shared by the admin result
// page and the student/guardian portal result page - one place renders a
// StudentExamResult, so a future change to what's shown doesn't have to be
// made in three places.
export async function ResultDetailView({
  examName,
  examTypeName,
  academicYearName,
  result,
}: {
  examName: string
  examTypeName: string
  academicYearName: string
  result: StudentExamResult
}) {
  const t = await getTranslations("results")

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            {examName} — {examTypeName}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{academicYearName}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("student.subjectResults")}</CardTitle>
        </CardHeader>
        <CardContent>
          {result.subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("detail.noSubjectsScheduled")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("fields.subject")}</TableHead>
                  <TableHead>{t("fields.fullMarks")}</TableHead>
                  <TableHead>{t("fields.obtainedMarks")}</TableHead>
                  <TableHead>{t("fields.percentage")}</TableHead>
                  <TableHead>{t("fields.grade")}</TableHead>
                  <TableHead>{t("fields.gradePoint")}</TableHead>
                  <TableHead>{t("fields.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.subjects.map((subject) => (
                  <TableRow key={subject.scheduleId}>
                    <TableCell>{subject.subjectName}</TableCell>
                    <TableCell>{subject.fullMarks}</TableCell>
                    <TableCell>
                      {subject.status === "ABSENT" && t("status.absent")}
                      {subject.status === "PENDING" && t("status.pending")}
                      {(subject.status === "PASS" || subject.status === "FAIL") && subject.marks}
                    </TableCell>
                    <TableCell>{subject.percentage !== null ? `${subject.percentage}%` : "—"}</TableCell>
                    <TableCell>{subject.grade ?? "—"}</TableCell>
                    <TableCell>{subject.gradePoint !== null ? subject.gradePoint.toFixed(2) : "—"}</TableCell>
                    <TableCell>
                      {subject.status === "PASS" && t("status.pass")}
                      {subject.status === "FAIL" && t("status.fail")}
                      {subject.status === "ABSENT" && t("status.absent")}
                      {subject.status === "PENDING" && t("status.pending")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("student.summary")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-xs uppercase text-muted-foreground">{t("fields.totalMarks")}</p>
            <p className="text-lg font-semibold">
              {result.isComplete ? `${result.totalObtainedMarks} / ${result.totalFullMarks}` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">{t("fields.percentage")}</p>
            <p className="text-lg font-semibold">
              {result.overallPercentage !== null ? `${result.overallPercentage}%` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">{t("fields.gpa")}</p>
            <p className="text-lg font-semibold">{result.gpa !== null ? result.gpa.toFixed(2) : "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">{t("fields.result")}</p>
            <p className="text-lg font-semibold">
              {result.overallStatus === "PASS" && t("status.pass")}
              {result.overallStatus === "FAIL" && t("status.fail")}
              {result.overallStatus === "INCOMPLETE" && t("status.incomplete")}
              {result.overallStatus === "NO_RESULT" && t("status.noResult")}
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
