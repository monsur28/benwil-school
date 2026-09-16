import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { requireAuth } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { getStudentExamResult } from "@/lib/results/get-results"
import { checkResultAccess } from "@/lib/results/result-access"
import { PageHeader } from "@/components/shared/page-header"
import { ResultDetailView } from "@/components/results/result-detail-view"
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

  const [student, exam] = await Promise.all([
    prisma.student.findFirst({ where: { id: studentId, schoolId: user.schoolId } }),
    prisma.exam.findFirst({ where: { id: examId, schoolId: user.schoolId }, select: { academicYearId: true } }),
  ])
  if (!student || !exam) notFound()

  const access = await checkResultAccess(user, exam.academicYearId, student.classId, student.sectionId)
  if (!access.ok) redirect("/unauthorized")

  const context = await getStudentExamResult({ schoolId: user.schoolId, examId, studentId })
  if (!context) notFound()

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

      <ResultDetailView
        examName={context.exam.name}
        examTypeName={context.exam.examTypeName}
        academicYearName={context.exam.academicYearName}
        result={context.result}
      />
    </div>
  )
}
