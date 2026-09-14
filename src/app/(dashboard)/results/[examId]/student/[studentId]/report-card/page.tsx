import { notFound, redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { getStudentExamResult } from "@/lib/results/get-results"
import { checkResultAccess } from "@/lib/results/result-access"
import { ReportCardView } from "@/components/results/report-card-view"

export default async function ReportCardPage({
  params,
}: {
  params: Promise<{ examId: string; studentId: string }>
}) {
  const user = await requireAuth()
  const { examId, studentId } = await params

  const student = await prisma.student.findFirst({ where: { id: studentId, schoolId: user.schoolId } })
  if (!student) notFound()

  const access = await checkResultAccess(user, student.classId, student.sectionId)
  if (!access.ok) redirect("/unauthorized")

  const school = await prisma.school.findFirstOrThrow({ where: { id: user.schoolId } })
  const context = await getStudentExamResult({ schoolId: user.schoolId, examId, studentId })
  if (!context) notFound()

  return <ReportCardView schoolName={school.name} context={context} />
}
