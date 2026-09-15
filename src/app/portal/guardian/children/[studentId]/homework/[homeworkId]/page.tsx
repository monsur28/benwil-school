import { notFound } from "next/navigation"
import { requireGuardianIdentity, requireGuardianChild } from "@/lib/portal/identity"
import { getHomeworkDetailForStudent } from "@/lib/homework/homework-visibility"
import { SharedHomeworkDetail } from "@/components/portal/shared-homework-detail"

export default async function GuardianChildHomeworkDetailPage({
  params,
}: {
  params: Promise<{ studentId: string; homeworkId: string }>
}) {
  const { user, guardian } = await requireGuardianIdentity()
  const { studentId, homeworkId } = await params
  const student = await requireGuardianChild(guardian.id, studentId, user.schoolId)

  const homework = await getHomeworkDetailForStudent({
    schoolId: user.schoolId,
    homeworkId,
    academicYearId: student.academicYearId,
    classId: student.classId,
    sectionId: student.sectionId,
  })
  if (!homework) notFound()

  return <SharedHomeworkDetail homework={homework} basePath={`/portal/guardian/children/${studentId}/homework`} />
}
