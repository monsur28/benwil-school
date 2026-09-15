import { notFound } from "next/navigation"
import { requireGuardianIdentity } from "@/lib/portal/identity"
import { getNoticeForGuardian } from "@/lib/notices/notice-visibility"
import { SharedNoticeDetail } from "@/components/portal/shared-notice-detail"

export default async function GuardianNoticeDetailPage({
  params,
}: {
  params: Promise<{ noticeId: string }>
}) {
  const { user, children } = await requireGuardianIdentity()
  const { noticeId } = await params

  const notice = await getNoticeForGuardian({
    schoolId: user.schoolId,
    noticeId,
    childClassIds: children.map((child) => child.classId),
    childSectionIds: children.map((child) => child.sectionId),
  })
  if (!notice) notFound()

  return <SharedNoticeDetail notice={notice} basePath="/portal/guardian/notices" />
}
