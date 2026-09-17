import { notFound } from "next/navigation"
import { requireGuardianIdentity, requireGuardianChild } from "@/lib/portal/identity"
import { prisma } from "@/lib/db/client"
import { getStudentExamResult } from "@/lib/results/get-results"
import { ReportCardView } from "@/components/results/report-card-view"

export default async function GuardianChildReportCardPage({
  params,
}: {
  params: Promise<{ studentId: string; examId: string }>
}) {
  const { user, guardian } = await requireGuardianIdentity()
  const { studentId, examId } = await params
  const { student } = await requireGuardianChild(guardian.id, studentId, user.schoolId)

  const context = await getStudentExamResult({ schoolId: user.schoolId, examId, studentId: student.id })
  if (!context || context.exam.resultStatus !== "FINALIZED") notFound()

  const school = await prisma.school.findFirstOrThrow({ where: { id: user.schoolId } })

  return <ReportCardView schoolName={school.name} context={context} />
}
