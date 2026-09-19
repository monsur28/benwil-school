import { notFound } from "next/navigation"
import { requireGuardianIdentity, requireGuardianChild } from "@/lib/portal/identity"
import { getPaymentReceipt } from "@/lib/fees/get-fees"
import { getSchoolIdentity } from "@/lib/settings/school-settings"
import { ReceiptView } from "@/components/fees/receipt-view"

export default async function GuardianChildFeeReceiptPage({
  params,
}: {
  params: Promise<{ studentId: string; paymentId: string }>
}) {
  const { user, guardian } = await requireGuardianIdentity()
  const { studentId, paymentId } = await params
  const { student } = await requireGuardianChild(guardian.id, studentId, user.schoolId)

  const receipt = await getPaymentReceipt({ schoolId: user.schoolId, paymentId, studentId: student.id })
  if (!receipt) notFound()

  const identity = await getSchoolIdentity(user.schoolId)

  return <ReceiptView schoolName={identity.schoolName} receipt={receipt} />
}
