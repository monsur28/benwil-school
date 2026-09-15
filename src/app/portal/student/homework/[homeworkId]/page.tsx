import { notFound } from "next/navigation"
import { requireStudentIdentity } from "@/lib/portal/identity"
import { getHomeworkDetailForStudent } from "@/lib/homework/homework-visibility"
import { SharedHomeworkDetail } from "@/components/portal/shared-homework-detail"

export default async function StudentHomeworkDetailPage({
  params,
}: {
  params: Promise<{ homeworkId: string }>
}) {
  const { user, student } = await requireStudentIdentity()
  const { homeworkId } = await params

  const homework = await getHomeworkDetailForStudent({
    schoolId: user.schoolId,
    homeworkId,
    academicYearId: student.academicYearId,
    classId: student.classId,
    sectionId: student.sectionId,
  })
  if (!homework) notFound()

  return <SharedHomeworkDetail homework={homework} basePath="/portal/student/homework" />
}
