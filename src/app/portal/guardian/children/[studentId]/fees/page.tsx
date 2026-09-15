import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Wallet } from "lucide-react"
import { requireGuardianIdentity, requireGuardianChild } from "@/lib/portal/identity"
import { getStudentFeeOverview } from "@/lib/fees/get-fees"
import { EmptyState } from "@/components/shared/empty-state"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { FeeStatusBadge } from "@/components/fees/fee-status-badge"

export default async function GuardianChildFeesPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { user, guardian } = await requireGuardianIdentity()
  const { studentId } = await params
  const student = await requireGuardianChild(guardian.id, studentId, user.schoolId)
  const [t, tPortal] = await Promise.all([getTranslations("fees"), getTranslations("portal")])

  const { fees, payments, summary } = await getStudentFeeOverview({ schoolId: user.schoolId, studentId: student.id })

  if (fees.length === 0 && payments.length === 0) {
    return <EmptyState icon={Wallet} title={tPortal("empty.noFeesTitle")} description={tPortal("empty.noFees")} />
  }

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-lg font-bold">{t("subnav.student")}</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-normal text-muted-foreground">{t("fields.totalCharges")}</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold">{summary.totalCharges.toFixed(2)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-normal text-muted-foreground">{t("fields.totalPaid")}</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold">{summary.totalPaid.toFixed(2)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-normal text-muted-foreground">{t("fields.outstandingBalance")}</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold">{summary.totalOutstanding.toFixed(2)}</CardContent>
        </Card>
      </div>

      {fees.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">{t("subnav.student")}</h2>
          <div className="grid grid-cols-1 gap-2">
            {fees.map((fee) => (
              <Card key={fee.id}>
                <CardContent className="flex items-center justify-between p-4 text-sm">
                  <div>
                    <p className="font-medium">{fee.name}</p>
                    <p className="text-xs text-muted-foreground">{fee.categoryName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{fee.remaining.toFixed(2)}</p>
                    <FeeStatusBadge status={fee.status} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {payments.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">{t("subnav.payments")}</h2>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("fields.receiptNumber")}</TableHead>
                  <TableHead>{t("fields.paymentDate")}</TableHead>
                  <TableHead>{t("fields.amount")}</TableHead>
                  <TableHead className="text-right">{t("actions.label")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.receiptNumber}</TableCell>
                    <TableCell>{payment.paidAt.toLocaleDateString()}</TableCell>
                    <TableCell>{payment.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        nativeButton={false}
                        variant="ghost"
                        size="sm"
                        render={<Link href={`/portal/guardian/children/${studentId}/fees/${payment.id}/receipt`} />}
                      >
                        {t("actions.view")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
