import { getTranslations } from "next-intl/server"
import type { PaymentReceipt } from "@/lib/fees/get-fees"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PrintReceiptButton } from "@/components/fees/print-receipt-button"

// The printable receipt body, shared by the admin route and the
// student/guardian portal route - mirrors ReportCardView's structure and
// print:* Tailwind approach exactly, so print layout stays in one place.
export async function ReceiptView({ schoolName, receipt }: { schoolName: string; receipt: PaymentReceipt }) {
  const t = await getTranslations("fees")

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 rounded-xl border bg-card p-6 print:max-w-none print:border-0 print:p-0 print:shadow-none">
      <div className="flex items-start justify-between print:hidden">
        <p className="text-xs text-muted-foreground">{t("receipt.title")}</p>
        <PrintReceiptButton />
      </div>

      {receipt.status === "VOIDED" && (
        <Alert variant="destructive">
          <AlertDescription>
            {t("receipt.voided")}
            {receipt.voidedAt && receipt.voidedByName && (
              <>
                {" "}
                {t("receipt.voidedOn", { date: receipt.voidedAt.toLocaleDateString(), name: receipt.voidedByName })}
              </>
            )}
            {receipt.voidReason && (
              <div className="mt-1">
                {t("receipt.voidReasonLabel")}: {receipt.voidReason}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-1 border-b pb-4 text-center">
        <h1 className="font-heading text-xl font-bold">{schoolName}</h1>
        <p className="text-sm text-muted-foreground">{t("receipt.title")}</p>
        <p className="text-sm font-medium">{receipt.receiptNumber}</p>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
        <div>
          <span className="text-muted-foreground">{t("fields.student")}: </span>
          <span className="font-medium">{receipt.student.name}</span>
        </div>
        <div>
          <span className="text-muted-foreground">{t("fields.class")}: </span>
          <span className="font-medium">
            {receipt.student.className} {receipt.student.sectionName}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">{t("fields.paymentDate")}: </span>
          <span className="font-medium">{receipt.paidAt.toLocaleDateString()}</span>
        </div>
        <div>
          <span className="text-muted-foreground">{t("fields.paymentMethod")}: </span>
          <span className="font-medium">{t(`method.${receipt.method}`)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">{t("fields.receivedBy")}: </span>
          <span className="font-medium">{receipt.receivedByName}</span>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("fields.name")}</TableHead>
            <TableHead className="text-right">{t("fields.amount")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {receipt.allocations.map((allocation, index) => (
            <TableRow key={index}>
              <TableCell>{allocation.feeName}</TableCell>
              <TableCell className="text-right">{allocation.amount.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between border-t pt-4">
        <p className="text-sm font-medium">{t("fields.amount")}</p>
        <p className="text-lg font-semibold">{receipt.amount.toFixed(2)}</p>
      </div>

      {receipt.notes && (
        <p className="text-sm text-muted-foreground">
          {t("fields.notes")}: {receipt.notes}
        </p>
      )}
    </div>
  )
}
