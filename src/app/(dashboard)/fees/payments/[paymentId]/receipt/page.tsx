import Link from "next/link"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { getRolesForHref } from "@/lib/permissions/nav"
import { FEE_ADMIN_ROLES } from "@/lib/fees/fee-access"
import { getPaymentReceipt } from "@/lib/fees/get-fees"
import { getSchoolIdentity } from "@/lib/settings/school-settings"
import { ReceiptView } from "@/components/fees/receipt-view"
import { Button } from "@/components/ui/button"

export default async function PaymentReceiptPage({
  params,
}: {
  params: Promise<{ paymentId: string }>
}) {
  const user = await requireRole(...getRolesForHref("/fees/payments"))
  const t = await getTranslations("fees")
  const { paymentId } = await params

  const receipt = await getPaymentReceipt({ schoolId: user.schoolId, paymentId })
  if (!receipt) notFound()

  const identity = await getSchoolIdentity(user.schoolId)
  const canVoid = FEE_ADMIN_ROLES.includes(user.role) && receipt.status === "COMPLETED"

  return (
    <div className="space-y-4">
      <ReceiptView schoolName={identity.schoolName} receipt={receipt} />
      {canVoid && (
        <div className="mx-auto flex w-full max-w-2xl justify-end print:hidden">
          <Button
            nativeButton={false}
            variant="outline"
            size="sm"
            render={<Link href={`/fees/payments/${paymentId}/void`} />}
          >
            {t("actions.voidPayment")}
          </Button>
        </div>
      )}
    </div>
  )
}
