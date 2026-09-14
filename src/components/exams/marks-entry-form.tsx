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
  roster: RosterRow[]
}

export function MarksEntryForm({ examScheduleId, sectionId, fullMarks, roster }: MarksEntryFormProps) {
  const t = useTranslations("exams")
  const router = useRouter()
  const [rows, setRows] = useState(roster)
  const [isPending, startTransition] = useTransition()

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
    startTransition(async () => {
      const result = await saveExamMarks({
        examScheduleId,
        sectionId,
        entries: rows.map((row) => ({ studentId: row.studentId, marks: row.marks, isAbsent: row.isAbsent })),
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
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("fields.roll")}</TableHead>
              <TableHead>{t("fields.admissionNumber")}</TableHead>
              <TableHead>{t("fields.name")}</TableHead>
              <TableHead>
                {t("fields.marks")} (/{fullMarks})
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
                    max={fullMarks}
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
