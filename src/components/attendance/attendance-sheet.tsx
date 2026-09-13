"use client"

import { useMemo, useState, useTransition } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Search, Info, Users } from "lucide-react"
import type { AttendanceStatus } from "@prisma/client"
import { saveAttendance } from "@/actions/attendance/save-attendance"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { EmptyState } from "@/components/shared/empty-state"
import { toast } from "@/components/ui/toast"

const STATUS_ORDER: AttendanceStatus[] = ["PRESENT", "ABSENT", "LATE", "LEAVE"]

const STATUS_VARIANT: Record<AttendanceStatus, "default" | "destructive" | "secondary" | "outline"> = {
  PRESENT: "default",
  ABSENT: "destructive",
  LATE: "secondary",
  LEAVE: "outline",
}

export type AttendanceStudent = { id: string; name: string; roll: number }

export function AttendanceSheet({
  classId,
  sectionId,
  academicYearId,
  date,
  students,
  initialStatuses,
  lastUpdated,
}: {
  classId: string
  sectionId: string
  academicYearId: string
  date: string
  students: AttendanceStudent[]
  initialStatuses: Record<string, AttendanceStatus>
  lastUpdated: string | null
}) {
  const t = useTranslations("attendance")
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(() => {
    const initial: Record<string, AttendanceStatus> = {}
    for (const student of students) {
      initial[student.id] = initialStatuses[student.id] ?? "PRESENT"
    }
    return initial
  })
  const [error, setError] = useState<string | null>(null)

  const summary = useMemo(() => {
    const counts: Record<AttendanceStatus, number> = { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0 }
    for (const status of Object.values(statuses)) counts[status] += 1
    return counts
  }, [statuses])

  const visibleStudents = useMemo(() => {
    if (!search.trim()) return students
    const query = search.trim().toLowerCase()
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(query) || String(student.roll).includes(query)
    )
  }, [students, search])

  function markAllPresent() {
    setStatuses(() => {
      const next: Record<string, AttendanceStatus> = {}
      for (const student of students) next[student.id] = "PRESENT"
      return next
    })
  }

  function onSave() {
    setError(null)
    startTransition(async () => {
      const result = await saveAttendance({
        classId,
        sectionId,
        academicYearId,
        date,
        entries: students.map((student) => ({
          studentId: student.id,
          status: statuses[student.id],
        })),
      })

      if ("error" in result) {
        setError(result.error)
        return
      }

      toast.add({ title: t("success.saved"), type: "success" })
    })
  }

  if (students.length === 0) {
    return <EmptyState icon={Users} title={t("empty.noStudents")} />
  }

  return (
    <div className="space-y-4">
      {lastUpdated && (
        <Alert>
          <Info />
          <AlertDescription>
            {t("alreadySubmitted", {
              time: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
                new Date(lastUpdated)
              ),
            })}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="pl-8"
          />
        </div>
        <Button type="button" variant="outline" onClick={markAllPresent}>
          {t("actions.markAllPresent")}
        </Button>
      </div>

      <div className="divide-y rounded-lg border">
        {visibleStudents.map((student) => (
          <div
            key={student.id}
            className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 shrink-0 text-sm text-muted-foreground">{student.roll}</span>
              <span className="font-medium">{student.name}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_ORDER.map((status) => {
                const isSelected = statuses[student.id] === status
                return (
                  <Button
                    key={status}
                    type="button"
                    size="sm"
                    variant={isSelected ? STATUS_VARIANT[status] : "outline"}
                    onClick={() => setStatuses((prev) => ({ ...prev, [student.id]: status }))}
                  >
                    {t(`status.${status}`)}
                  </Button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {STATUS_ORDER.map((status) => (
            <span key={status}>
              <span className="text-muted-foreground">{t(`status.${status}`)}: </span>
              <span className="font-semibold">{summary[status]}</span>
            </span>
          ))}
        </div>
        <Button type="button" onClick={onSave} disabled={isPending}>
          {isPending ? t("actions.saving") : t("actions.save")}
        </Button>
      </div>
    </div>
  )
}
