import Link from "next/link"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { requireStudentIdentity } from "@/lib/portal/identity"
import { getStudentExamResult } from "@/lib/results/get-results"
import { ResultDetailView } from "@/components/results/result-detail-view"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export default async function StudentResultDetailPage({
  params,
}: {
  params: Promise<{ examId: string }>
}) {
  const { user, student } = await requireStudentIdentity()
  const { examId } = await params
  const t = await getTranslations("results")

  const context = await getStudentExamResult({ schoolId: user.schoolId, examId, studentId: student.id })
  // A DRAFT (or reopened) exam must be invisible in the portal, enforced
  // here server-side every request - not just filtered out of the list.
  if (!context || context.exam.resultStatus !== "FINALIZED") notFound()

  return (
    <div className="space-y-4">
      <Button
        nativeButton={false}
        variant="outline"
        size="sm"
        className="gap-1.5"
        render={<Link href={`/portal/student/results/${examId}/report-card`} />}
      >
        <Printer />
        {t("actions.viewReportCard")}
      </Button>

      <ResultDetailView
        examName={context.exam.name}
        examTypeName={context.exam.examTypeName}
        academicYearName={context.exam.academicYearName}
        result={context.result}
      />
    </div>
  )
}
