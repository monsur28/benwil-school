import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { getRolesForHref } from "@/lib/permissions/nav"
import { getPaymentsReport } from "@/lib/fees/get-fees"
import type { PaymentMethod, PaymentStatus } from "@prisma/client"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { FilterBar } from "@/components/shared/filter-bar"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { FeesSubNav } from "@/components/fees/fees-subnav"
import { PaymentFilters } from "@/components/fees/payment-filters"

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await requireRole(...getRolesForHref("/fees/payments"))
  const t = await getTranslations("fees")
  const params = await searchParams

  const q = typeof params.q === "string" ? params.q : ""
  const from = typeof params.from === "string" ? params.from : ""
  const to = typeof params.to === "string" ? params.to : ""
  const method = typeof params.method === "string" ? params.method : ""
  const status = typeof params.status === "string" ? params.status : ""

  const payments = await getPaymentsReport({
    schoolId: user.schoolId,
    search: q || undefined,
    dateFrom: from ? new Date(from) : undefined,
    dateTo: to ? new Date(to) : undefined,
    method: (method || undefined) as PaymentMethod | undefined,
    status: (status || undefined) as PaymentStatus | undefined,
  })

  return (
    <div className="space-y-6">
      <PageHeader title={t("subnav.payments")} />
      <FeesSubNav />
      <FilterBar>
        <PaymentFilters />
      </FilterBar>

      {payments.length === 0 ? (
        <EmptyState icon={Wallet} title={t("list.emptyPayments")} />
      ) : (
        <div className="panel overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fields.receiptNumber")}</TableHead>
                <TableHead>{t("fields.student")}</TableHead>
                <TableHead>{t("fields.class")}</TableHead>
                <TableHead>{t("fields.paymentDate")}</TableHead>
                <TableHead>{t("fields.amount")}</TableHead>
                <TableHead>{t("fields.paymentMethod")}</TableHead>
                <TableHead>{t("fields.status")}</TableHead>
                <TableHead className="text-right">{t("actions.label")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.receiptNumber}</TableCell>
                  <TableCell>
                    {payment.studentName} <span className="text-xs text-muted-foreground">({payment.studentUid})</span>
                  </TableCell>
                  <TableCell>{payment.className}</TableCell>
                  <TableCell>{payment.paidAt.toLocaleDateString()}</TableCell>
                  <TableCell>{payment.amount.toFixed(2)}</TableCell>
                  <TableCell>{t(`method.${payment.method}`)}</TableCell>
                  <TableCell>{t(`status.${payment.status}`)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      nativeButton={false}
                      variant="ghost"
                      size="sm"
                      render={<Link href={`/fees/payments/${payment.id}/receipt`} />}
                    >
                      {t("actions.view")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
