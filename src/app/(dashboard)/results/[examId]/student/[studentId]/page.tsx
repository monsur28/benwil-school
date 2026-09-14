import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { requireAuth } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { getStudentExamResult } from "@/lib/results/get-results"
import { checkResultAccess } from "@/lib/results/result-access"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export default async function StudentResultPage({
  params,
}: {
  params: Promise<{ examId: string; studentId: string }>
}) {
  const user = await requireAuth()
  const { examId, studentId } = await params
  const t = await getTranslations("results")

  const student = await prisma.student.findFirst({ where: { id: studentId, schoolId: user.schoolId } })
  if (!student) notFound()

  const access = await checkResultAccess(user, student.classId, student.sectionId)
  if (!access.ok) redirect("/unauthorized")

  const context = await getStudentExamResult({ schoolId: user.schoolId, examId, studentId })
  if (!context) notFound()

  const { result } = context

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("student.header")}
        description={`${context.student.name} • ${context.student.studentUid} • ${context.student.className} ${context.student.sectionName} • ${t("fields.roll")} ${context.student.roll}`}
        actions={
          <Button
            nativeButton={false}
            variant="outline"
            size="sm"
            className="gap-1.5"
            render={<Link href={`/results/${examId}/student/${studentId}/report-card`} />}
          >
            <Printer />
            {t("actions.viewReportCard")}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{context.exam.name} — {context.exam.examTypeName}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{context.exam.academicYearName}</CardContent>
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
            <p className="text-lg font-semibold">{result.overallPercentage !== null ? `${result.overallPercentage}%` : "—"}</p>
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
    </div>
  )
}
