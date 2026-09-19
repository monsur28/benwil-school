import { notFound } from "next/navigation"
import { requireStudentIdentity } from "@/lib/portal/identity"
import { getPaymentReceipt } from "@/lib/fees/get-fees"
import { getSchoolIdentity } from "@/lib/settings/school-settings"
import { ReceiptView } from "@/components/fees/receipt-view"

export default async function StudentFeeReceiptPage({
  params,
}: {
  params: Promise<{ paymentId: string }>
}) {
  const { user, student } = await requireStudentIdentity()
  const { paymentId } = await params

  const receipt = await getPaymentReceipt({ schoolId: user.schoolId, paymentId, studentId: student.id })
  if (!receipt) notFound()

  const identity = await getSchoolIdentity(user.schoolId)

  return <ReceiptView schoolName={identity.schoolName} receipt={receipt} />
}
