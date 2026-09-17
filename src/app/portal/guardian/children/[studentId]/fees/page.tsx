import { requireGuardianIdentity, requireGuardianChild } from "@/lib/portal/identity"
import { SharedFeesPage } from "@/components/portal/shared-fees-page"

export default async function GuardianChildFeesPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { user, guardian } = await requireGuardianIdentity()
  const { studentId } = await params
  const { student } = await requireGuardianChild(guardian.id, studentId, user.schoolId)

  return (
    <SharedFeesPage 
      schoolId={user.schoolId} 
      studentId={student.id} 
      baseReceiptPath={`/portal/guardian/children/${student.id}/fees`} 
    />
  )
}
