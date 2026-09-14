import Link from "next/link"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { requireGuardianIdentity, requireGuardianChild } from "@/lib/portal/identity"
import { getStudentExamResult } from "@/lib/results/get-results"
import { ResultDetailView } from "@/components/results/result-detail-view"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export default async function GuardianChildResultDetailPage({
  params,
}: {
  params: Promise<{ studentId: string; examId: string }>
}) {
  const { user, guardian } = await requireGuardianIdentity()
  const { studentId, examId } = await params
  const student = await requireGuardianChild(guardian.id, studentId, user.schoolId)
  const t = await getTranslations("results")

  const context = await getStudentExamResult({ schoolId: user.schoolId, examId, studentId: student.id })
  if (!context || context.exam.resultStatus !== "FINALIZED") notFound()

  return (
    <div className="space-y-4">
      <Button
        nativeButton={false}
        variant="outline"
        size="sm"
        className="gap-1.5"
        render={<Link href={`/portal/guardian/children/${studentId}/results/${examId}/report-card`} />}
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
