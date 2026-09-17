"use client"

import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { ArrowRight, FileText, Plus, Receipt, WalletCards } from "lucide-react"
import { Panel, PanelHeader } from "@/components/shared/panel"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDateTime } from "@/lib/format"
import { FeeStatusBadge } from "@/components/fees/fee-status-badge"

export interface RecentPaymentItem {
  id: string
  receiptNumber: string
  amount: number
  method: string
  status: "COMPLETED" | "VOIDED"
  paidAt: Date
  student: {
    id: string
    name: string
    studentUid: string
    roll: number
    class: { name: string }
    section: { name: string }
  }
  receivedBy: {
    name: string
  }
}

interface RecentPaymentsCardProps {
  payments: RecentPaymentItem[]
}

const METHOD_LABELS: Record<string, { label: string; class: string }> = {
  CASH: { label: "Cash", class: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800" },
  MOBILE_BANKING: { label: "bKash / Nagad", class: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-400 dark:border-pink-800" },
  BANK_TRANSFER: { label: "Bank", class: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800" },
  CHEQUE: { label: "Cheque", class: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800" },
  OTHER: { label: "Other", class: "bg-muted text-muted-foreground border-border" },
}

export function RecentPaymentsCard({ payments }: RecentPaymentsCardProps) {
  const t = useTranslations("fees")
  const tDash = useTranslations("fees.dashboard")
  const locale = useLocale()

  return (
    <Panel tone="default" className="overflow-hidden">
      <PanelHeader
        title={tDash("recentPayments")}
        description={tDash("recentPaymentsDesc")}
        icon={<Receipt />}
        iconTone="blue"
        href="/fees/payments"
        hrefLabel={tDash("viewAllPayments")}
      />

      {payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
            <Receipt className="size-6" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-foreground">{tDash("noRecentPayments")}</h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">{tDash("noRecentPaymentsDesc")}</p>
          <Button
            nativeButton={false}
            size="sm"
            className="mt-4 gap-1.5"
            render={<Link href="/fees/student" />}
          >
            <Plus className="size-4" />
            {tDash("recordFirstPayment")}
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border-light hover:bg-transparent">
                <TableHead className="w-[120px] text-xs font-semibold text-muted-foreground">{t("fields.receiptNumber")}</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">{t("fields.student")}</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">{t("fields.class")}</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">{t("fields.paymentDate")}</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">{t("fields.paymentMethod")}</TableHead>
                <TableHead className="text-right text-xs font-semibold text-muted-foreground">{t("fields.amount")}</TableHead>
                <TableHead className="w-[80px] text-right text-xs font-semibold text-muted-foreground">{t("actions.label")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => {
                const methodConfig = METHOD_LABELS[p.method] ?? METHOD_LABELS.OTHER
                return (
                  <TableRow key={p.id} className="border-border-light transition-colors hover:bg-muted/20">
                    <TableCell className="font-mono text-xs font-semibold text-foreground">
                      <span className="inline-flex items-center gap-1">
                        <FileText className="size-3 text-muted-foreground" />
                        {p.receiptNumber}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="min-w-[130px]">
                        <Link
                          href={`/fees/student/${p.student.id}`}
                          className="font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {p.student.name}
                        </Link>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span>{p.student.studentUid}</span>
                          <span>·</span>
                          <span>Roll {p.student.roll}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[11px] font-normal">
                        {p.student.class.name} - {p.student.section.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(p.paidAt, locale)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${methodConfig.class}`}
                      >
                        {t(`method.${p.method}`)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-sm font-bold text-success">
                        +{formatCurrency(p.amount, locale, "৳")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        nativeButton={false}
                        variant="ghost"
                        size="xs"
                        className="h-7 text-xs font-medium text-primary hover:bg-primary/10"
                        render={<Link href={`/fees/payments/${p.id}/receipt`} />}
                      >
                        {tDash("viewReceipt")}
                        <ArrowRight className="size-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </Panel>
  )
}
