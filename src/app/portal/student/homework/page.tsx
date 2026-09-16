import { getTranslations } from "next-intl/server"
import { requireStudentIdentity } from "@/lib/portal/identity"
import { getVisibleHomeworkForStudent } from "@/lib/homework/homework-visibility"
import { PageHeader } from "@/components/shared/page-header"
import { SharedHomeworkList } from "@/components/portal/shared-homework-list"

export default async function StudentHomeworkPage() {
  const { user, student } = await requireStudentIdentity()
  const t = await getTranslations("homework")

  const { homework } = await getVisibleHomeworkForStudent({
    schoolId: user.schoolId,
    academicYearId: student.academicYearId,
    classId: student.classId,
    sectionId: student.sectionId,
  })

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} />
      <SharedHomeworkList homework={homework} basePath="/portal/student/homework" />
    </div>
  )
}
