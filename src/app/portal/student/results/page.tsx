import { requireStudentIdentity } from "@/lib/portal/identity"
import { getStudentResultSummaries } from "@/lib/results/get-results"
import { ResultList } from "@/components/portal/result-list"

export default async function StudentResultsPage() {
  const { user, student } = await requireStudentIdentity()

  const summaries = await getStudentResultSummaries({
    schoolId: user.schoolId,
    studentId: student.id,
    classId: student.classId,
    finalizedOnly: true,
  })

  return <ResultList summaries={summaries} buildHref={(examId) => `/portal/student/results/${examId}`} />
}
