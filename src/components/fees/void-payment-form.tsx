"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { voidPayment } from "@/actions/fees/payments"
import { Field, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/toast"

export function VoidPaymentForm({ paymentId }: { paymentId: string }) {
  const t = useTranslations("fees")
  const router = useRouter()
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function onSubmit() {
    if (!reason.trim()) {
      setError(t("errors.reasonRequired"))
      return
    }
    startTransition(async () => {
      const result = await voidPayment({ paymentId, voidReason: reason })
      if (result.error) {
        setError(result.error)
        return
      }
      toast.add({ title: t("success.paymentVoided"), type: "success" })
      router.push(`/fees/payments/${paymentId}/receipt`)
      router.refresh()
    })
  }

  return (
    <div className="max-w-md space-y-4">
      <p className="text-sm text-muted-foreground">{t("void.description")}</p>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Field>
        <FieldLabel htmlFor="void-reason">{t("void.reasonLabel")}</FieldLabel>
        <Textarea id="void-reason" value={reason} onChange={(event) => setReason(event.target.value)} />
      </Field>
      <Button variant="destructive" disabled={isPending} onClick={onSubmit}>
        {t("actions.voidPayment")}
      </Button>
    </div>
  )
}
