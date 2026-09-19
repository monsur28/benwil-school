import { notFound } from "next/navigation"
import { requireGuardianIdentity, requireGuardianChild } from "@/lib/portal/identity"
import { getStudentExamResult } from "@/lib/results/get-results"
import { getSchoolIdentity } from "@/lib/settings/school-settings"
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

  const identity = await getSchoolIdentity(user.schoolId)

  return <ReportCardView identity={identity} context={context} />
}
