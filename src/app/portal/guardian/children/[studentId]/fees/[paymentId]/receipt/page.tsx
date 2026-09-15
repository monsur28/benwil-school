import { notFound } from "next/navigation"
import { requireGuardianIdentity, requireGuardianChild } from "@/lib/portal/identity"
import { getPaymentReceipt } from "@/lib/fees/get-fees"
import { prisma } from "@/lib/db/client"
import { ReceiptView } from "@/components/fees/receipt-view"

export default async function GuardianChildFeeReceiptPage({
  params,
}: {
  params: Promise<{ studentId: string; paymentId: string }>
}) {
  const { user, guardian } = await requireGuardianIdentity()
  const { studentId, paymentId } = await params
  const student = await requireGuardianChild(guardian.id, studentId, user.schoolId)

  const receipt = await getPaymentReceipt({ schoolId: user.schoolId, paymentId, studentId: student.id })
  if (!receipt) notFound()

  const school = await prisma.school.findFirstOrThrow({ where: { id: user.schoolId } })

  return <ReceiptView schoolName={school.name} receipt={receipt} />
}
