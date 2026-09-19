import { notFound } from "next/navigation"
import { requireStudentIdentity } from "@/lib/portal/identity"
import { getStudentExamResult } from "@/lib/results/get-results"
import { getSchoolIdentity } from "@/lib/settings/school-settings"
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

  const identity = await getSchoolIdentity(user.schoolId)

  return <ReportCardView identity={identity} context={context} />
}
