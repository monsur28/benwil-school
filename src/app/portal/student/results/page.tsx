import { getTranslations } from "next-intl/server"
import { requireStudentIdentity } from "@/lib/portal/identity"
import { getStudentResultSummaries } from "@/lib/results/get-results"
import { PageHeader } from "@/components/shared/page-header"
import { ResultList } from "@/components/portal/result-list"

export default async function StudentResultsPage() {
  const { user, student } = await requireStudentIdentity()
  const t = await getTranslations("portal")

  const summaries = await getStudentResultSummaries({
    schoolId: user.schoolId,
    studentId: student.id,
    classId: student.classId,
    finalizedOnly: true,
  })

  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.results")} />
      <ResultList summaries={summaries} buildHref={(examId) => `/portal/student/results/${examId}`} />
    </div>
  )
}
