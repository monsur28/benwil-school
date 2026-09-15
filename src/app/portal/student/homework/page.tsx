import { getTranslations } from "next-intl/server"
import { requireStudentIdentity } from "@/lib/portal/identity"
import { getVisibleHomeworkForStudent } from "@/lib/homework/homework-visibility"
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
    <div className="space-y-4">
      <h1 className="font-heading text-xl font-bold tracking-tight">{t("title")}</h1>
      <SharedHomeworkList homework={homework} basePath="/portal/student/homework" />
    </div>
  )
}
