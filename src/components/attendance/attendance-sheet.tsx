"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  Search,
  Users,
  Check,
  X,
  Clock,
  Calendar,
  CheckCheck,
  Save,
  AlertCircle,
} from "lucide-react"
import type { AttendanceStatus } from "@prisma/client"
import { cn } from "cn"
import { saveAttendance } from "@/actions/attendance/save-attendance"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { EmptyState } from "@/components/shared/empty-state"
import { toast } from "@/components/ui/toast"

const STATUS_ORDER: AttendanceStatus[] = ["PRESENT", "ABSENT", "LATE", "LEAVE"]

const STATUS_CONFIG: Record<
  AttendanceStatus,
  {
    icon: typeof Check
    activeClass: string
    iconClass: string
    dotClass: string
    textClass: string
    bgLightClass: string
  }
> = {
  PRESENT: {
    icon: Check,
    activeClass:
      "border-success-border bg-success-light text-success font-semibold shadow-2xs ring-1 ring-success-border",
    iconClass: "text-success",
    dotClass: "bg-success",
    textClass: "text-success",
    bgLightClass: "bg-success-light",
  },
  ABSENT: {
    icon: X,
    activeClass:
      "border-danger-border bg-danger-light text-danger font-semibold shadow-2xs ring-1 ring-danger-border",
    iconClass: "text-danger",
    dotClass: "bg-danger",
    textClass: "text-danger",
    bgLightClass: "bg-danger-light",
  },
  LATE: {
    icon: Clock,
    activeClass:
      "border-warning-border bg-warning-light text-warning font-semibold shadow-2xs ring-1 ring-warning-border",
    iconClass: "text-warning",
    dotClass: "bg-warning",
    textClass: "text-warning",
    bgLightClass: "bg-warning-light",
  },
  LEAVE: {
    icon: Calendar,
    activeClass:
      "border-info-border bg-info-light text-info font-semibold shadow-2xs ring-1 ring-info-border",
    iconClass: "text-info",
    dotClass: "bg-info",
    textClass: "text-info",
    bgLightClass: "bg-info-light",
  },
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
  const [lastUpdatedState, setLastUpdatedState] = useState<string | null>(lastUpdated)

  // Track current statuses and initial/saved snapshot for unsaved changes detection
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>(() => {
    const initial: Record<string, AttendanceStatus> = {}
    for (const student of students) {
      initial[student.id] = initialStatuses[student.id] ?? "PRESENT"
    }
    return initial
  })

  const [savedStatuses, setSavedStatuses] = useState<Record<string, AttendanceStatus>>(() => {
    const initial: Record<string, AttendanceStatus> = {}
    for (const student of students) {
      initial[student.id] = initialStatuses[student.id] ?? "PRESENT"
    }
    return initial
  })

  const [error, setError] = useState<string | null>(null)

  // Detect uncommitted changes compared to last saved state
  const hasUnsavedChanges = useMemo(() => {
    return students.some((student) => statuses[student.id] !== savedStatuses[student.id])
  }, [students, statuses, savedStatuses])

  // Prevent accidental navigation with unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Live tally
  const summary = useMemo(() => {
    const counts: Record<AttendanceStatus, number> = { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0 }
    for (const student of students) {
      const st = statuses[student.id] ?? "PRESENT"
      counts[st] = (counts[st] || 0) + 1
    }
    return counts
  }, [students, statuses])

  // Client search filtering without losing attendance selections
  const visibleStudents = useMemo(() => {
    if (!search.trim()) return students
    const query = search.trim().toLowerCase()
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(query) || String(student.roll).includes(query)
    )
  }, [students, search])

  // Bulk action: Mark entire roster Present
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
          status: statuses[student.id] ?? "PRESENT",
        })),
      })

      if (!result.success) {
        setError(result.error)
        return
      }

      setSavedStatuses({ ...statuses })
      setLastUpdatedState(new Date().toISOString())
      toast.add({ title: t("success.saved"), type: "success" })
    })
  }

  if (students.length === 0) {
    return <EmptyState icon={Users} title={t("empty.noStudents")} />
  }

  return (
    <div className="space-y-5">
      {/* Attendance Status Banner (Submitted vs Untouched) */}
      {lastUpdatedState && (
        <div className="flex flex-col gap-2.5 rounded-xl border border-success-border/70 bg-success-light/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-success text-white shadow-2xs">
              <Check className="size-4 stroke-[2.5]" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-success">
                {t("submittedStatus.title")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("submittedStatus.lastUpdated", {
                  time: new Intl.DateTimeFormat(locale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(lastUpdatedState)),
                })}
              </p>
            </div>
          </div>
          <p className="text-xs font-medium text-muted-foreground sm:text-right">
            {t("submittedStatus.canEdit")}
          </p>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Top Live Summary Card */}
      <div className="panel overflow-hidden p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="eyebrow">{t("liveSummaryHeading")}</h2>
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
              {t("studentsCount", { count: students.length })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {hasUnsavedChanges ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-light px-2.5 py-0.5 text-xs font-semibold text-warning">
                <span className="size-1.5 rounded-full bg-warning animate-pulse" />
                {t("unsavedChanges")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                <Check className="size-3 text-success" />
                {t("allSaved")}
              </span>
            )}
          </div>
        </div>

        {/* Live Counters */}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {STATUS_ORDER.map((status) => {
            const config = STATUS_CONFIG[status]
            const count = summary[status]
            const pct = students.length > 0 ? Math.round((count / students.length) * 100) : 0

            return (
              <div
                key={status}
                className="flex items-center justify-between rounded-xl border border-border-light bg-card p-2.5 transition-colors sm:p-3"
              >
                <div className="flex items-center gap-2">
                  <span className={cn("size-2.5 shrink-0 rounded-full", config.dotClass)} />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-muted-foreground">
                      {t(`status.${status}`)}
                    </span>
                    <span className={cn("metric text-xl sm:text-2xl", config.textClass)}>
                      {count}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-medium tabular-nums text-muted-foreground/70">
                  {pct}%
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Roster Controls: Search & Mark All Present */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="h-9.5 pl-9 pr-8 text-sm"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label={t("clearSearch")}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={markAllPresent}
          className="w-full sm:w-auto font-medium"
        >
          <CheckCheck className="size-4 text-success" />
          {t("actions.markAllPresent")}
        </Button>
      </div>

      {/* Student Roster List */}
      <div className="panel overflow-hidden">
        {/* Roster Header */}
        <div className="flex items-center justify-between border-b border-border-light bg-subtle/50 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="eyebrow">{t("rosterHeading")}</span>
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
              {search.trim()
                ? t("showingCount", { filtered: visibleStudents.length, total: students.length })
                : t("studentsCount", { count: students.length })}
            </span>
          </div>
          <span className="hidden text-xs text-muted-foreground md:inline-block">
            {t("fields.status")}
          </span>
        </div>

        {/* Empty Search Result */}
        {visibleStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
              <Search className="size-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">
              {t("noSearchResults", { query: search })}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSearch("")}
              className="mt-3.5"
            >
              {t("clearSearch")}
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border-light">
            {visibleStudents.map((student) => {
              const currentStatus = statuses[student.id] ?? "PRESENT"

              return (
                <div
                  key={student.id}
                  className="flex flex-col gap-2.5 p-3 transition-colors hover:bg-subtle/70 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-2.5"
                >
                  {/* Student Roll and Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold tabular-nums text-muted-foreground font-mono">
                      {student.roll}
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-semibold text-foreground sm:text-[15px]">
                        {student.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground sm:hidden">
                        {t("rollLabel", { roll: student.roll })}
                      </span>
                    </div>
                  </div>

                  {/* Status Toggle Controls (Responsive 4-grid on mobile, flex row on sm+) */}
                  <div className="grid grid-cols-4 gap-1 w-full sm:w-auto sm:flex sm:items-center sm:gap-1.5">
                    {STATUS_ORDER.map((status) => {
                      const isSelected = currentStatus === status
                      const config = STATUS_CONFIG[status]
                      const Icon = config.icon

                      return (
                        <button
                          key={status}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() =>
                            setStatuses((prev) => ({ ...prev, [student.id]: status }))
                          }
                          className={cn(
                            "inline-flex items-center justify-center gap-1 rounded-lg border text-xs transition-all select-none h-8 px-1.5 sm:px-3 sm:h-8.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            isSelected
                              ? config.activeClass
                              : "border-border-light bg-card text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground"
                          )}
                        >
                          <Icon
                            className={cn(
                              "size-3 sm:size-3.5 shrink-0",
                              isSelected ? config.iconClass : "text-muted-foreground/60"
                            )}
                          />
                          <span className={cn(isSelected ? "font-semibold" : "font-normal")}>
                            {t(`status.${status}`)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Docked Sticky Bottom Action Bar */}
      <div className="sticky bottom-4 z-20 rounded-2xl border border-border bg-card/95 p-3.5 shadow-elevated backdrop-blur-md transition-all sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Live counts recap */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 mr-2">
              {hasUnsavedChanges ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-light px-2 py-0.5 text-xs font-semibold text-warning">
                  <span className="size-1.5 rounded-full bg-warning animate-pulse" />
                  {t("unsavedChanges")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  <Check className="size-3 text-success" />
                  {t("allSaved")}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-[13px]">
              {STATUS_ORDER.map((status) => (
                <span key={status} className="inline-flex items-center gap-1">
                  <span className={cn("size-2 rounded-full", STATUS_CONFIG[status].dotClass)} />
                  <span className="font-semibold tabular-nums text-foreground">
                    {summary[status]}
                  </span>
                  <span className="text-muted-foreground">{t(`status.${status}`)}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Primary Save Action */}
          <div className="flex items-center justify-end">
            <Button
              type="button"
              onClick={onSave}
              disabled={isPending}
              className={cn(
                "w-full sm:w-auto font-semibold px-6 transition-all",
                hasUnsavedChanges && "ring-2 ring-primary/20 shadow-md"
              )}
            >
              {isPending ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t("actions.saving")}
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  {t("actions.save")}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
