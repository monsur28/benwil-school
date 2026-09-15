import { notFound } from "next/navigation"
import { requireStudentIdentity } from "@/lib/portal/identity"
import { getNoticeForStudent } from "@/lib/notices/notice-visibility"
import { SharedNoticeDetail } from "@/components/portal/shared-notice-detail"

export default async function StudentNoticeDetailPage({
  params,
}: {
  params: Promise<{ noticeId: string }>
}) {
  const { user, student } = await requireStudentIdentity()
  const { noticeId } = await params

  const notice = await getNoticeForStudent({
    schoolId: user.schoolId,
    noticeId,
    classId: student.classId,
    sectionId: student.sectionId,
  })
  if (!notice) notFound()

  return <SharedNoticeDetail notice={notice} basePath="/portal/student/notices" />
}
