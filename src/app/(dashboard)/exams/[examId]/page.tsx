import Link from "next/link"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Role } from "@prisma/client"
import { requireRole } from "@/lib/auth/dal"
import { getRolesForHref } from "@/lib/permissions/nav"
import { prisma } from "@/lib/db/client"
import { getExamCompletion } from "@/lib/exams/completion"
import { PageHeader } from "@/components/shared/page-header"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ExamsSubNav } from "@/components/exams/exams-subnav"
import { ExamScheduleDialog } from "@/components/exams/exam-schedule-dialog"
import { RemoveScheduleButton } from "@/components/exams/remove-schedule-button"

const CAN_MANAGE: Role[] = [Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.PRINCIPAL]

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ examId: string }>
}) {
  const user = await requireRole(...getRolesForHref("/exams"))
  const { examId } = await params
  const t = await getTranslations("exams")
  const canManage = CAN_MANAGE.includes(user.role)

  const exam = await prisma.exam.findFirst({
    where: { id: examId, schoolId: user.schoolId },
    include: { academicYear: true, examType: true },
  })
  if (!exam) {
    notFound()
  }

  const [classes, classSubjectRows, schedules, completions] = await Promise.all([
    prisma.class.findMany({ where: { schoolId: user.schoolId }, orderBy: { order: "asc" } }),
    prisma.classSubject.findMany({
      where: { class: { schoolId: user.schoolId } },
      include: { subject: true },
    }),
    prisma.examSchedule.findMany({
      where: { examId, schoolId: user.schoolId },
      include: { class: true, subject: true },
      orderBy: [{ class: { order: "asc" } }, { subject: { name: "asc" } }],
    }),
    getExamCompletion(examId, user.schoolId),
  ])

  const classSubjects = classSubjectRows.map((cs) => ({
    classId: cs.classId,
    subjectId: cs.subjectId,
    subjectName: cs.subject.name,
  }))
  const completionByScheduleId = new Map(completions.map((row) => [row.scheduleId, row]))

  return (
    <div className="space-y-6">
      <PageHeader
        title={exam.name}
        description={`${exam.examType.name} • ${exam.academicYear.name} • ${exam.startDate.toLocaleDateString()} – ${exam.endDate.toLocaleDateString()}`}
        actions={
          canManage && (
            <ExamScheduleDialog examId={examId} classes={classes} classSubjects={classSubjects} />
          )
        }
      />
      <ExamsSubNav />
      <div className="panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("fields.class")}</TableHead>
              <TableHead>{t("fields.subject")}</TableHead>
              <TableHead>{t("fields.examDate")}</TableHead>
              <TableHead>{t("fields.fullMarks")}</TableHead>
              <TableHead>{t("fields.passMarks")}</TableHead>
              <TableHead>{t("detail.scheduledSubjects")}</TableHead>
              <TableHead className="text-right">{t("actions.label")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  {t("detail.empty")}
                </TableCell>
              </TableRow>
            ) : (
              schedules.map((schedule) => {
                const completion = completionByScheduleId.get(schedule.id)
                const hasMarks = Boolean(completion && completion.entered + completion.absent > 0)
                return (
                  <TableRow key={schedule.id}>
                    <TableCell>{schedule.class.name}</TableCell>
                    <TableCell>{schedule.subject.name}</TableCell>
                    <TableCell>{schedule.examDate.toLocaleDateString()}</TableCell>
                    <TableCell>{schedule.fullMarks}</TableCell>
                    <TableCell>{schedule.passMarks}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {completion
                        ? t("detail.completion", {
                            entered: completion.entered,
                            absent: completion.absent,
                            pending: completion.pending,
                            total: completion.totalStudents,
                          })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          nativeButton={false}
                          variant="ghost"
                          size="sm"
                          render={
                            <Link
                              href={`/exams/${examId}/marks?classId=${schedule.classId}&subjectId=${schedule.subjectId}`}
                            />
                          }
                        >
                          {t("detail.enterMarks")}
                        </Button>
                        {canManage && (
                          <>
                            <ExamScheduleDialog
                              examId={examId}
                              classes={classes}
                              classSubjects={classSubjects}
                              schedule={schedule}
                            />
                            <RemoveScheduleButton id={schedule.id} hasMarks={hasMarks} />
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
