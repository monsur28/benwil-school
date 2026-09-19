"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { saveExamMarks, markAllAbsent } from "@/actions/exams/exam-marks"

type RosterRow = {
  studentId: string
  roll: number
  admissionNumber: string
  name: string
  marks: number | null
  isAbsent: boolean
}

type MarksEntryFormProps = {
  examScheduleId: string
  sectionId: string
  fullMarks: number
  homeworkMaxMarks: number | null
  roster: RosterRow[]
}

export function MarksEntryForm({
  examScheduleId,
  sectionId,
  fullMarks,
  homeworkMaxMarks,
  roster,
}: MarksEntryFormProps) {
  const t = useTranslations("exams")
  const router = useRouter()
  const [rows, setRows] = useState(roster)
  const [isPending, startTransition] = useTransition()
  // The homework portion is never typed in here - it's pulled automatically
  // from the student's own reviewed homework for this subject (spec Phase 12
  // §9/§21), so the written mark entered below is capped at what's left.
  const writtenMaxMarks = fullMarks - (homeworkMaxMarks ?? 0)

  function updateMarks(studentId: string, value: string) {
    const numeric = value === "" ? null : Number(value)
    setRows((current) =>
      current.map((row) => (row.studentId === studentId ? { ...row, marks: numeric, isAbsent: false } : row))
    )
  }

  function toggleAbsent(studentId: string, checked: boolean) {
    setRows((current) =>
      current.map((row) =>
        row.studentId === studentId ? { ...row, isAbsent: checked, marks: checked ? null : row.marks } : row
      )
    )
  }

  function handleSave() {
    // Only submit rows the teacher actually resolved (a mark entered, or
    // explicitly checked absent) — an untouched row stays "pending" (no
    // ExamMark row at all, per the completion overview) rather than being
    // upserted as null/false, which would immediately count it as "entered".
    const resolvedEntries = rows
      .filter((row) => row.marks !== null || row.isAbsent)
      .map((row) => ({ studentId: row.studentId, marks: row.marks, isAbsent: row.isAbsent }))

    if (resolvedEntries.length === 0) {
      toast.add({ title: t("marks.nothingToSave"), type: "info" })
      return
    }

    startTransition(async () => {
      const result = await saveExamMarks({
        examScheduleId,
        sectionId,
        entries: resolvedEntries,
      })
      if ("error" in result) {
        toast.add({ title: result.error, type: "error" })
        return
      }
      toast.add({ title: t("marks.saveSuccess"), type: "success" })
      router.refresh()
    })
  }

  function handleMarkAllAbsent() {
    startTransition(async () => {
      const result = await markAllAbsent(examScheduleId, sectionId)
      if ("error" in result) {
        toast.add({ title: result.error, type: "error" })
        return
      }
      setRows((current) => current.map((row) => ({ ...row, marks: null, isAbsent: true })))
      toast.add({ title: t("marks.saveSuccess"), type: "success" })
      router.refresh()
    })
  }

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("detail.empty")}</p>
  }

  return (
    <div className="space-y-4">
      {homeworkMaxMarks ? (
        <p className="rounded-md border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">
          {t("marks.homeworkComponentHint", { writtenMaxMarks, homeworkMaxMarks })}
        </p>
      ) : null}
      <div className="panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("fields.roll")}</TableHead>
              <TableHead>{t("fields.admissionNumber")}</TableHead>
              <TableHead>{t("fields.name")}</TableHead>
              <TableHead>
                {t("fields.marks")} (/{writtenMaxMarks})
              </TableHead>
              <TableHead>{t("fields.absent")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.studentId}>
                <TableCell>{row.roll}</TableCell>
                <TableCell>{row.admissionNumber}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    max={writtenMaxMarks}
                    disabled={row.isAbsent}
                    value={row.marks ?? ""}
                    onChange={(event) => updateMarks(row.studentId, event.target.value)}
                    className="w-24"
                  />
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={row.isAbsent}
                    onCheckedChange={(checked) => toggleAbsent(row.studentId, checked)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" disabled={isPending} onClick={handleMarkAllAbsent}>
          {t("marks.markAllAbsent")}
        </Button>
        <Button disabled={isPending} onClick={handleSave}>
          {t("actions.save")}
        </Button>
      </div>
    </div>
  )
}
