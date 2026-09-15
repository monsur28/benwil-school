"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Ban, CircleSlash } from "lucide-react"
import { waiveStudentFee, cancelStudentFee } from "@/actions/fees/student-fees"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/toast"

export function WaiveCancelDialog({ studentFeeId, mode }: { studentFeeId: string; mode: "waive" | "cancel" }) {
  const t = useTranslations("fees")
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function onConfirm() {
    if (!reason.trim()) {
      setError(t("errors.reasonRequired"))
      return
    }
    startTransition(async () => {
      const result =
        mode === "waive"
          ? await waiveStudentFee({ studentFeeId, waiverReason: reason })
          : await cancelStudentFee({ studentFeeId, cancelReason: reason })
      if (!result.success) {
        setError(result.error)
        return
      }
      toast.add({ title: t(mode === "waive" ? "success.feeWaived" : "success.feeCancelled"), type: "success" })
      setOpen(false)
      setReason("")
      router.refresh()
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          setReason("")
          setError(null)
        }
      }}
    >
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        {mode === "waive" ? <CircleSlash /> : <Ban />}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(mode === "waive" ? "waiveCancel.waiveTitle" : "waiveCancel.cancelTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Field>
            <FieldLabel htmlFor="waive-cancel-reason">{t("waiveCancel.reasonLabel")}</FieldLabel>
            <Textarea id="waive-cancel-reason" value={reason} onChange={(event) => setReason(event.target.value)} />
            <FieldError errors={[]} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="destructive" disabled={isPending} onClick={onConfirm}>
            {t(mode === "waive" ? "actions.waive" : "actions.cancelFee")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
