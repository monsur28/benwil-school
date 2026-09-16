import { getTranslations } from "next-intl/server"
import { requireStudentIdentity } from "@/lib/portal/identity"
import { getVisibleNoticesForStudent } from "@/lib/notices/notice-visibility"
import { PageHeader } from "@/components/shared/page-header"
import { SharedNoticesList } from "@/components/portal/shared-notices-list"

export default async function StudentNoticesPage() {
  const { user, student } = await requireStudentIdentity()
  const t = await getTranslations("notices")

  const notices = await getVisibleNoticesForStudent({
    schoolId: user.schoolId,
    classId: student.classId,
    sectionId: student.sectionId,
  })

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} />
      <SharedNoticesList notices={notices} basePath="/portal/student/notices" />
    </div>
  )
}
