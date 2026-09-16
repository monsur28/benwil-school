import { notFound } from "next/navigation"
import { requireStudentIdentity } from "@/lib/portal/identity"
import { getHomeworkDetailForStudent } from "@/lib/homework/homework-visibility"
import { getStudentSubmission } from "@/lib/homework/get-homework-submissions"
import { SharedHomeworkDetail } from "@/components/portal/shared-homework-detail"
import { StudentHomeworkSubmission } from "@/components/portal/student-homework-submission"

export default async function StudentHomeworkDetailPage({
  params,
}: {
  params: Promise<{ homeworkId: string }>
}) {
  const { user, student } = await requireStudentIdentity()
  const { homeworkId } = await params

  const [homework, submission] = await Promise.all([
    getHomeworkDetailForStudent({
      schoolId: user.schoolId,
      homeworkId,
      academicYearId: student.academicYearId,
      classId: student.classId,
      sectionId: student.sectionId,
    }),
    getStudentSubmission({
      schoolId: user.schoolId,
      homeworkId,
      studentId: student.id,
    }),
  ])

  if (!homework) notFound()

  return (
    <div className="space-y-6">
      <SharedHomeworkDetail homework={homework} basePath="/portal/student/homework" />
      <StudentHomeworkSubmission
        homeworkId={homework.id}
        dueDate={homework.dueDate}
        maxMarks={homework.maxMarks}
        submission={submission}
      />
    </div>
  )
}
