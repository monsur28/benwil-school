import { requireGuardianIdentity, requireGuardianChild } from "@/lib/portal/identity"
import { getStudentResultSummaries } from "@/lib/results/get-results"
import { ResultList } from "@/components/portal/result-list"

export default async function GuardianChildResultsPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { user, guardian } = await requireGuardianIdentity()
  const { studentId } = await params
  const { student } = await requireGuardianChild(guardian.id, studentId, user.schoolId)

  const summaries = await getStudentResultSummaries({
    schoolId: user.schoolId,
    studentId: student.id,
    classId: student.classId,
    finalizedOnly: true,
  })

  return (
    <ResultList
      summaries={summaries}
      buildHref={(examId) => `/portal/guardian/children/${studentId}/results/${examId}`}
    />
  )
}
