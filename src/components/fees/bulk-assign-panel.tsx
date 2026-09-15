"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { bulkAssignFeeToClass } from "@/actions/fees/student-fees"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/toast"

type EligibleStudent = { id: string; name: string; studentUid: string; alreadyAssigned: boolean }

export function BulkAssignPanel({
  structureId,
  defaultDueDate,
  eligibleStudents,
}: {
  structureId: string
  defaultDueDate: string
  eligibleStudents: EligibleStudent[]
}) {
  const t = useTranslations("fees")
  const router = useRouter()
  const [dueDate, setDueDate] = useState(defaultDueDate)
  const [isPending, startTransition] = useTransition()
  const [summary, setSummary] = useState<{ createdCount: number; skippedCount: number } | null>(null)

  const toAssignCount = eligibleStudents.filter((student) => !student.alreadyAssigned).length

  function onConfirm() {
    startTransition(async () => {
      const result = await bulkAssignFeeToClass({ feeStructureId: structureId, dueDate })
      if (!result.success) {
        toast.add({ title: result.error, type: "error" })
        return
      }
      setSummary(result.data ?? null)
      toast.add({ title: t("success.feeAssigned"), type: "success" })
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <Field className="max-w-xs">
        <FieldLabel htmlFor="bulk-assign-due-date">{t("fields.dueDate")}</FieldLabel>
        <Input
          id="bulk-assign-due-date"
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
        />
      </Field>

      {summary ? (
        <p className="text-sm text-muted-foreground">
          {t("assign.resultSummary", { createdCount: summary.createdCount, skippedCount: summary.skippedCount })}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">{t("assign.eligibleCount", { count: toAssignCount })}</p>
      )}

      <Card>
        <CardContent className="max-h-96 space-y-1 overflow-y-auto p-4">
          {eligibleStudents.map((student) => (
            <div key={student.id} className="flex items-center justify-between py-1 text-sm">
              <span>
                {student.name} <span className="text-xs text-muted-foreground">({student.studentUid})</span>
              </span>
              {student.alreadyAssigned && <Badge variant="secondary">{t("assign.alreadyAssigned")}</Badge>}
            </div>
          ))}
        </CardContent>
      </Card>

      <Button disabled={isPending || toAssignCount === 0} onClick={onConfirm}>
        {t("assign.confirm")}
      </Button>
    </div>
  )
}
