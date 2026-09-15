import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { getRolesForHref } from "@/lib/permissions/nav"
import { getPaymentsReport } from "@/lib/fees/get-fees"
import type { PaymentMethod, PaymentStatus } from "@prisma/client"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from "@/components/ui/table"
import { Wallet } from "lucide-react"
import { FeesSubNav } from "@/components/fees/fees-subnav"
import { PaymentFilters } from "@/components/fees/payment-filters"

export default async function CollectionsReportPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await requireRole(...getRolesForHref("/fees/reports/collections"))
  const t = await getTranslations("fees")
  const params = await searchParams

  const from = typeof params.from === "string" ? params.from : ""
  const to = typeof params.to === "string" ? params.to : ""
  const method = typeof params.method === "string" ? params.method : ""
  const status = typeof params.status === "string" ? params.status : "COMPLETED"

  const payments = await getPaymentsReport({
    schoolId: user.schoolId,
    dateFrom: from ? new Date(from) : undefined,
    dateTo: to ? new Date(to) : undefined,
    method: (method || undefined) as PaymentMethod | undefined,
    status: (status || undefined) as PaymentStatus | undefined,
  })

  const total = payments.filter((p) => p.status === "COMPLETED").reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6">
      <PageHeader title={t("reports.collectionsTitle")} />
      <div className="print:hidden">
        <FeesSubNav />
        <PaymentFilters />
      </div>

      {payments.length === 0 ? (
        <EmptyState icon={Wallet} title={t("list.emptyPayments")} />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("fields.receiptNumber")}</TableHead>
                <TableHead>{t("fields.student")}</TableHead>
                <TableHead>{t("fields.class")}</TableHead>
                <TableHead>{t("fields.paymentDate")}</TableHead>
                <TableHead>{t("fields.paymentMethod")}</TableHead>
                <TableHead>{t("fields.status")}</TableHead>
                <TableHead>{t("fields.amount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.receiptNumber}</TableCell>
                  <TableCell>{payment.studentName}</TableCell>
                  <TableCell>{payment.className}</TableCell>
                  <TableCell>{payment.paidAt.toLocaleDateString()}</TableCell>
                  <TableCell>{t(`method.${payment.method}`)}</TableCell>
                  <TableCell>{t(`status.${payment.status}`)}</TableCell>
                  <TableCell>{payment.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={6}>{t("fields.totalPaid")}</TableCell>
                <TableCell>{total.toFixed(2)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  )
}
