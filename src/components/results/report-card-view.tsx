import { getTranslations } from "next-intl/server"
import type { StudentResultContext } from "@/lib/results/get-results"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { PrintReportCardButton } from "@/components/results/print-report-card-button"

// The printable report card body, shared by the admin route and the
// student/guardian portal route - one place renders it, so print layout
// and calculation stay in exactly one component.
export async function ReportCardView({
  schoolName,
  context,
}: {
  schoolName: string
  context: StudentResultContext
}) {
  const t = await getTranslations("results")
  const { result } = context

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl border bg-card p-6 print:max-w-none print:border-0 print:p-0 print:shadow-none">
      <div className="flex items-start justify-between print:hidden">
        <p className="text-xs text-muted-foreground">{t("reportCard.title")}</p>
        <PrintReportCardButton />
      </div>

      <div className="space-y-1 border-b pb-4 text-center">
        <h1 className="font-heading text-xl font-bold">{schoolName}</h1>
        <p className="text-sm text-muted-foreground">{t("reportCard.title")}</p>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
        <div>
          <span className="text-muted-foreground">{t("fields.student")}: </span>
          <span className="font-medium">{context.student.name}</span>
        </div>
        <div>
          <span className="text-muted-foreground">{t("fields.admissionNumber")}: </span>
          <span className="font-medium">{context.student.admissionNumber}</span>
        </div>
        <div>
          <span className="text-muted-foreground">{t("fields.roll")}: </span>
          <span className="font-medium">{context.student.roll}</span>
        </div>
        <div>
          <span className="text-muted-foreground">{t("fields.class")}: </span>
          <span className="font-medium">{context.student.className}</span>
        </div>
        <div>
          <span className="text-muted-foreground">{t("fields.section")}: </span>
          <span className="font-medium">{context.student.sectionName}</span>
        </div>
        <div>
          <span className="text-muted-foreground">{t("fields.academicYear")}: </span>
          <span className="font-medium">{context.exam.academicYearName}</span>
        </div>
        <div className="col-span-2 sm:col-span-3">
          <span className="text-muted-foreground">{t("fields.exam")}: </span>
          <span className="font-medium">
            {context.exam.name} ({context.exam.examTypeName})
          </span>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("fields.subject")}</TableHead>
            <TableHead>{t("fields.fullMarks")}</TableHead>
            <TableHead>{t("fields.obtainedMarks")}</TableHead>
            <TableHead>{t("fields.percentage")}</TableHead>
            <TableHead>{t("fields.grade")}</TableHead>
            <TableHead>{t("fields.gradePoint")}</TableHead>
            <TableHead>{t("fields.result")}</TableHead>
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

      <div className="grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-4">
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
          <p className="text-xs uppercase text-muted-foreground">{t("reportCard.finalResult")}</p>
          <p className="text-lg font-semibold">
            {result.overallStatus === "PASS" && t("status.pass")}
            {result.overallStatus === "FAIL" && t("status.fail")}
            {result.overallStatus === "INCOMPLETE" && t("status.incomplete")}
            {result.overallStatus === "NO_RESULT" && t("status.noResult")}
          </p>
        </div>
      </div>
    </div>
  )
}
