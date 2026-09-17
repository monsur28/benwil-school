import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Wallet } from "lucide-react"
import { getStudentFeeOverview } from "@/lib/fees/get-fees"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { Panel, PanelHeader } from "@/components/shared/panel"
import { StatRow, StatTile } from "@/components/shared/stat-tile"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { FeeStatusBadge } from "@/components/fees/fee-status-badge"

interface SharedFeesPageProps {
  schoolId: string
  studentId: string
  baseReceiptPath: string
}

/**
 * A family's view of what is owed and what has been paid.
 *
 * Hierarchy: the outstanding balance is what a guardian opens this page for,
 * so it leads the summary band in a warning tone when non-zero; the charge
 * list and the receipt history follow as two distinct panels.
 */
export async function SharedFeesPage({ schoolId, studentId, baseReceiptPath }: SharedFeesPageProps) {
  const [t, tPortal] = await Promise.all([getTranslations("fees"), getTranslations("portal")])

  const { fees, payments, summary } = await getStudentFeeOverview({ schoolId, studentId })

  if (fees.length === 0 && payments.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title={tPortal("nav.fees")} />
        <EmptyState icon={Wallet} title={tPortal("empty.noFeesTitle")} description={tPortal("empty.noFees")} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={tPortal("nav.fees")} />

      <StatRow columns={3}>
        <StatTile label={t("fields.totalCharges")} value={summary.totalCharges.toFixed(2)} tone="neutral" />
        <StatTile label={t("fields.totalPaid")} value={summary.totalPaid.toFixed(2)} tone="success" />
        <StatTile
          label={t("fields.outstandingBalance")}
          value={summary.totalOutstanding.toFixed(2)}
          tone={summary.totalOutstanding > 0 ? "warning" : "neutral"}
        />
      </StatRow>

      {fees.length > 0 && (
        <Panel>
          <PanelHeader title={t("subnav.student")} />
          <ul className="divide-y divide-border-light">
            {fees.map((fee) => (
              <li
                key={fee.id}
                className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-semibold text-foreground">{fee.name}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">{fee.categoryName}</span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="text-base font-bold tabular-nums text-foreground">
                    {fee.remaining.toFixed(2)}
                  </span>
                  <FeeStatusBadge status={fee.status} />
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {payments.length > 0 && (
        <Panel>
          <PanelHeader title={t("subnav.payments")} />
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
                  <TableCell className="font-medium tabular-nums">{payment.receiptNumber}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {payment.paidAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-semibold tabular-nums">{payment.amount.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      nativeButton={false}
                      variant="ghost"
                      size="sm"
                      render={<Link href={`${baseReceiptPath}/${payment.id}/receipt`} />}
                    >
                      {t("actions.view")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      )}
    </div>
  )
}
