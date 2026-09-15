import { getTranslations } from "next-intl/server"
import { requireGuardianIdentity } from "@/lib/portal/identity"
import { getVisibleNoticesForGuardian } from "@/lib/notices/notice-visibility"
import { SharedNoticesList } from "@/components/portal/shared-notices-list"

export default async function GuardianNoticesPage() {
  const { user, children } = await requireGuardianIdentity()
  const t = await getTranslations("notices")

  const notices = await getVisibleNoticesForGuardian({
    schoolId: user.schoolId,
    childClassIds: children.map((child) => child.classId),
    childSectionIds: children.map((child) => child.sectionId),
  })

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-xl font-bold tracking-tight">{t("title")}</h1>
      <SharedNoticesList notices={notices} basePath="/portal/guardian/notices" />
    </div>
  )
}
