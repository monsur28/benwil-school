import { notFound, redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { getStudentExamResult } from "@/lib/results/get-results"
import { checkResultAccess } from "@/lib/results/result-access"
import { getSchoolIdentity } from "@/lib/settings/school-settings"
import { ReportCardView } from "@/components/results/report-card-view"

export default async function ReportCardPage({
  params,
}: {
  params: Promise<{ examId: string; studentId: string }>
}) {
  const user = await requireAuth()
  const { examId, studentId } = await params

  const [student, exam] = await Promise.all([
    prisma.student.findFirst({ where: { id: studentId, schoolId: user.schoolId } }),
    prisma.exam.findFirst({ where: { id: examId, schoolId: user.schoolId }, select: { academicYearId: true } }),
  ])
  if (!student || !exam) notFound()

  const access = await checkResultAccess(user, exam.academicYearId, student.classId, student.sectionId)
  if (!access.ok) redirect("/unauthorized")

  const identity = await getSchoolIdentity(user.schoolId)
  const context = await getStudentExamResult({ schoolId: user.schoolId, examId, studentId })
  if (!context) notFound()

  return <ReportCardView identity={identity} context={context} />
}
