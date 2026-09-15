"use client"

import { useMemo, useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { createPayment } from "@/actions/fees/payments"
import { PAYMENT_METHODS } from "@/lib/validations/fees"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Field, FieldLabel } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { EmptyState } from "@/components/shared/empty-state"
import { Wallet } from "lucide-react"

type OutstandingFee = { id: string; name: string; remaining: number }

export function RecordPaymentForm({ studentId, outstandingFees }: { studentId: string; outstandingFees: OutstandingFee[] }) {
  const t = useTranslations("fees")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [method, setMethod] = useState<(typeof PAYMENT_METHODS)[number]>("CASH")
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState("")

  const totalAllocated = useMemo(
    () => Object.values(selected).reduce((sum, value) => sum + (Number(value) || 0), 0),
    [selected]
  )

  function toggleFee(fee: OutstandingFee, checked: boolean) {
    setSelected((prev) => {
      const next = { ...prev }
      if (checked) {
        next[fee.id] = fee.remaining.toFixed(2)
      } else {
        delete next[fee.id]
      }
      return next
    })
  }

  function setAllocationAmount(feeId: string, value: string) {
    setSelected((prev) => ({ ...prev, [feeId]: value }))
  }

  function onSubmit() {
    setError(null)
    const allocations = Object.entries(selected)
      .filter(([, amount]) => Number(amount) > 0)
      .map(([studentFeeId, amount]) => ({ studentFeeId, amount: Number(amount) }))

    if (allocations.length === 0) {
      setError(t("errors.noAllocations"))
      return
    }

    startTransition(async () => {
      const result = await createPayment({
        studentId,
        amount: totalAllocated,
        method,
        paidAt,
        notes,
        allocations,
      })
      if (!result.success) {
        setError(result.error)
        return
      }
      router.push(`/fees/payments/${result.data!.paymentId}/receipt`)
    })
  }

  if (outstandingFees.length === 0) {
    return <EmptyState icon={Wallet} title={t("payment.noOutstandingFees")} />
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">{t("payment.allocate")}</TableHead>
              <TableHead>{t("fields.name")}</TableHead>
              <TableHead>{t("fields.balance")}</TableHead>
              <TableHead className="w-32">{t("fields.amount")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {outstandingFees.map((fee) => {
              const isChecked = fee.id in selected
              return (
                <TableRow key={fee.id}>
                  <TableCell>
                    <Checkbox checked={isChecked} onCheckedChange={(checked) => toggleFee(fee, Boolean(checked))} />
                  </TableCell>
                  <TableCell>{fee.name}</TableCell>
                  <TableCell>{fee.remaining.toFixed(2)}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={fee.remaining}
                      disabled={!isChecked}
                      value={selected[fee.id] ?? ""}
                      onChange={(event) => setAllocationAmount(fee.id, event.target.value)}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field>
          <FieldLabel>{t("payment.totalAllocated")}</FieldLabel>
          <Input value={totalAllocated.toFixed(2)} disabled />
        </Field>
        <Field>
          <FieldLabel htmlFor="payment-method">{t("fields.paymentMethod")}</FieldLabel>
          <NativeSelect
            id="payment-method"
            value={method}
            onChange={(event) => setMethod(event.target.value as (typeof PAYMENT_METHODS)[number])}
          >
            {PAYMENT_METHODS.map((paymentMethod) => (
              <NativeSelectOption key={paymentMethod} value={paymentMethod}>
                {t(`method.${paymentMethod}`)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="payment-date">{t("fields.paymentDate")}</FieldLabel>
          <Input id="payment-date" type="date" value={paidAt} onChange={(event) => setPaidAt(event.target.value)} />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="payment-notes">{t("fields.notes")}</FieldLabel>
        <Textarea id="payment-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
      </Field>

      <Button disabled={isPending || totalAllocated <= 0} onClick={onSubmit}>
        {t("actions.recordPayment")}
      </Button>
    </div>
  )
}
