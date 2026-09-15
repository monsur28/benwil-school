import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { FEE_ADMIN_ROLES } from "@/lib/fees/fee-access"
import { prisma } from "@/lib/db/client"
import { PageHeader } from "@/components/shared/page-header"
import { VoidPaymentForm } from "@/components/fees/void-payment-form"

export default async function VoidPaymentPage({
  params,
}: {
  params: Promise<{ paymentId: string }>
}) {
  const user = await requireRole(...FEE_ADMIN_ROLES)
  const t = await getTranslations("fees")
  const { paymentId } = await params

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, schoolId: user.schoolId },
    select: { id: true, receiptNumber: true, status: true },
  })
  if (!payment || payment.status !== "COMPLETED") notFound()

  return (
    <div className="space-y-6">
      <PageHeader title={t("void.title")} description={payment.receiptNumber} />
      <VoidPaymentForm paymentId={payment.id} />
    </div>
  )
}
