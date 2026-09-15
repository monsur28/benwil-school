import { notFound } from "next/navigation"
import { requireStudentIdentity } from "@/lib/portal/identity"
import { getPaymentReceipt } from "@/lib/fees/get-fees"
import { prisma } from "@/lib/db/client"
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

  const school = await prisma.school.findFirstOrThrow({ where: { id: user.schoolId } })

  return <ReceiptView schoolName={school.name} receipt={receipt} />
}
