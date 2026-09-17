import { getTranslations } from "next-intl/server"
import { requireGuardianIdentity, requireGuardianChild } from "@/lib/portal/identity"
import { getVisibleHomeworkForStudent } from "@/lib/homework/homework-visibility"
import { SharedHomeworkList } from "@/components/portal/shared-homework-list"

export default async function GuardianChildHomeworkPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { user, guardian } = await requireGuardianIdentity()
  const { studentId } = await params
  const { student } = await requireGuardianChild(guardian.id, studentId, user.schoolId)
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
      <SharedHomeworkList homework={homework} basePath={`/portal/guardian/children/${studentId}/homework`} />
    </div>
  )
}
