import { notFound } from "next/navigation"
import { requireStudentIdentity } from "@/lib/portal/identity"
import { prisma } from "@/lib/db/client"
import { getStudentExamResult } from "@/lib/results/get-results"
import { ReportCardView } from "@/components/results/report-card-view"

export default async function StudentReportCardPage({
  params,
}: {
  params: Promise<{ examId: string }>
}) {
  const { user, student } = await requireStudentIdentity()
  const { examId } = await params

  const context = await getStudentExamResult({ schoolId: user.schoolId, examId, studentId: student.id })
  if (!context || context.exam.resultStatus !== "FINALIZED") notFound()

  const school = await prisma.school.findFirstOrThrow({ where: { id: user.schoolId } })

  return <ReportCardView schoolName={school.name} context={context} />
}
