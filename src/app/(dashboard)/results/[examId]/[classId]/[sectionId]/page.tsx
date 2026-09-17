import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { requireAuth } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { getClassSectionResults } from "@/lib/results/get-results"
import { checkResultAccess, RESULT_ADMIN_ROLES } from "@/lib/results/result-access"
import { PageHeader } from "@/components/shared/page-header"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { SectionSwitcher } from "@/components/results/section-switcher"
import { FinalizeResultsButton } from "@/components/results/finalize-results-button"
import { ReopenResultsButton } from "@/components/results/reopen-results-button"

export default async function ClassSectionResultsPage({
  params,
}: {
  params: Promise<{ examId: string; classId: string; sectionId: string }>
}) {
  const user = await requireAuth()
  const { examId, classId, sectionId } = await params
  const t = await getTranslations("results")

  const exam = await prisma.exam.findFirst({
    where: { id: examId, schoolId: user.schoolId },
    include: { academicYear: true, examType: true },
  })
  if (!exam) notFound()

  const classRecord = await prisma.class.findFirst({ where: { id: classId, schoolId: user.schoolId } })
  if (!classRecord) notFound()

  const access = await checkResultAccess(user, exam.academicYearId, classId, sectionId)
  if (!access.ok) redirect("/unauthorized")

  const sections = await prisma.section.findMany({ where: { classId }, orderBy: { name: "asc" } })
  const currentSection = sections.find((section) => section.id === sectionId)
  if (!currentSection) notFound()

  const canManage = RESULT_ADMIN_ROLES.includes(user.role)

  const { schedules, rows, isComplete } = await getClassSectionResults({
    schoolId: user.schoolId,
    examId,
    classId,
    sectionId,
    academicYearId: exam.academicYearId,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${exam.name} — ${classRecord.name} ${currentSection.name}`}
        description={`${exam.examType.name} • ${exam.academicYear.name} • ${isComplete ? t("status.complete") : t("status.incomplete")} • ${exam.resultStatus === "FINALIZED" ? t("status.finalized") : t("status.draft")}`}
        actions={
          canManage &&
          (exam.resultStatus === "FINALIZED" ? (
            <ReopenResultsButton examId={examId} />
          ) : (
            <FinalizeResultsButton examId={examId} />
          ))
        }
      />

      <SectionSwitcher examId={examId} classId={classId} sectionId={sectionId} sections={sections} />

      {schedules.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("detail.noSubjectsScheduled")}</p>
      ) : (
        <div className="panel overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fields.roll")}</TableHead>
                <TableHead>{t("fields.student")}</TableHead>
                <TableHead>{t("fields.totalMarks")}</TableHead>
                <TableHead>{t("fields.percentage")}</TableHead>
                <TableHead>{t("fields.gpa")}</TableHead>
                <TableHead>{t("fields.result")}</TableHead>
                <TableHead className="text-right">{t("actions.label")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {t("detail.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.studentId}>
                    <TableCell>{row.roll}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>
                      {row.isComplete ? `${row.totalObtainedMarks} / ${row.totalFullMarks}` : "—"}
                    </TableCell>
                    <TableCell>{row.overallPercentage !== null ? `${row.overallPercentage}%` : "—"}</TableCell>
                    <TableCell>{row.gpa !== null ? row.gpa.toFixed(2) : "—"}</TableCell>
                    <TableCell>
                      {row.overallStatus === "PASS" && t("status.pass")}
                      {row.overallStatus === "FAIL" && t("status.fail")}
                      {row.overallStatus === "INCOMPLETE" && t("status.incomplete")}
                      {row.overallStatus === "NO_RESULT" && t("status.noResult")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        nativeButton={false}
                        variant="ghost"
                        size="sm"
                        render={<Link href={`/results/${examId}/student/${row.studentId}`} />}
                      >
                        {t("actions.viewResult")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
