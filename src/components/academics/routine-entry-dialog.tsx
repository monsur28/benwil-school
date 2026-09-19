"use client"

import { useState, useTransition, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Plus } from "lucide-react"
import { DayOfWeek } from "@prisma/client"
import { createRoutineEntry, updateRoutineEntry } from "@/actions/academics/routine"
import { routineEntrySchema, type RoutineEntryFormInput } from "@/lib/validations/routine"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/toast"

export type RoutineClassSubject = {
  subjectId: string
  subjectName: string
}

export type RoutineTeacherAssignment = {
  subjectId: string
  teacherId: string
  teacherName: string
}

export type RoutineEntryData = {
  id: string
  dayOfWeek: DayOfWeek
  periodNumber: number
  startTime: string
  endTime: string
  subjectId: string
  teacherId: string
  room: string | null
}

interface RoutineEntryDialogProps {
  academicYearId: string
  classId: string
  sectionId: string
  classSubjects: RoutineClassSubject[]
  teacherAssignments: RoutineTeacherAssignment[]
  entry?: RoutineEntryData
  trigger?: React.ReactElement
}

const ORDERED_DAYS = [
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
]

export function RoutineEntryDialog({
  academicYearId,
  classId,
  sectionId,
  classSubjects,
  teacherAssignments,
  entry,
  trigger,
}: RoutineEntryDialogProps) {
  const t = useTranslations("routine")
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Prefer a subject that actually has a teacher assigned for this class/
  // section - defaulting to classSubjects[0] regardless would often land on
  // a subject with no assignment (e.g. alphabetically-first "Bangla" when
  // only "Mathematics" has a teacher), leaving the teacher select empty and
  // Save permanently disabled with no indication why.
  const defaultSubjectId =
    entry?.subjectId ??
    classSubjects.find((cs) => teacherAssignments.some((a) => a.subjectId === cs.subjectId))
      ?.subjectId ??
    classSubjects[0]?.subjectId ??
    ""
  const defaultTeacherId =
    entry?.teacherId ??
    teacherAssignments.find((a) => a.subjectId === defaultSubjectId)?.teacherId ??
    ""

  const form = useForm<RoutineEntryFormInput>({
    resolver: zodResolver(routineEntrySchema),
    defaultValues: {
      academicYearId,
      classId,
      sectionId,
      dayOfWeek: entry?.dayOfWeek ?? DayOfWeek.SATURDAY,
      periodNumber: entry?.periodNumber ?? 1,
      startTime: entry?.startTime ?? "09:00",
      endTime: entry?.endTime ?? "09:45",
      subjectId: defaultSubjectId,
      teacherId: defaultTeacherId,
      room: entry?.room ?? "",
    },
  })

  const watchedSubjectId = form.watch("subjectId")

  // Available teachers assigned to this subject
  const availableTeachers = useMemo(() => {
    const matching = teacherAssignments.filter((a) => a.subjectId === watchedSubjectId)
    // De-duplicate teachers if assigned multiple times
    const unique = new Map<string, string>()
    matching.forEach((m) => unique.set(m.teacherId, m.teacherName))
    return Array.from(unique.entries()).map(([teacherId, teacherName]) => ({
      teacherId,
      teacherName,
    }))
  }, [teacherAssignments, watchedSubjectId])

  function onSubjectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newSubjectId = e.target.value
    form.setValue("subjectId", newSubjectId)
    const firstTeacher = teacherAssignments.find((a) => a.subjectId === newSubjectId)
    form.setValue("teacherId", firstTeacher ? firstTeacher.teacherId : "")
  }

  function submit(values: RoutineEntryFormInput) {
    startTransition(async () => {
      const result = entry
        ? await updateRoutineEntry({ ...values, id: entry.id })
        : await createRoutineEntry(values)

      if (!result.success) {
        form.setError("root", { message: result.error })
        return
      }

      toast.add({ title: t("success.saved"), type: "success" })
      setOpen(false)
      if (!entry) {
        // Keep the just-submitted subject/teacher rather than resetting to
        // classSubjects[0] (which may have no teacher assigned, e.g.
        // alphabetically-first "Bangla" when only "Mathematics" is taught) -
        // this also matches the common case of adding several consecutive
        // periods for the same subject/teacher.
        form.reset({
          academicYearId,
          classId,
          sectionId,
          dayOfWeek: values.dayOfWeek,
          periodNumber: Number(values.periodNumber) + 1 <= 12 ? Number(values.periodNumber) + 1 : 1,
          startTime: values.endTime,
          endTime: values.endTime,
          subjectId: values.subjectId,
          teacherId: values.teacherId,
          room: values.room ?? "",
        })
      }
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <DialogTrigger render={<Button size="sm" />}>
          <Plus className="size-4 mr-1" />
          {t("addEntry")}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{entry ? t("editEntry") : t("addEntry")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                {t("day")}
              </label>
              <NativeSelect {...form.register("dayOfWeek")} className="w-full">
                {ORDERED_DAYS.map((day) => (
                  <NativeSelectOption key={day} value={day}>
                    {t(`days.${day}`)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                {t("period")}
              </label>
              <NativeSelect {...form.register("periodNumber")} className="w-full">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((p) => (
                  <NativeSelectOption key={p} value={String(p)}>
                    {t("periodNumber", { number: p })}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                {t("startTime")}
              </label>
              <Input type="time" {...form.register("startTime")} className="w-full" required />
              {form.formState.errors.startTime && (
                <p className="text-[11px] text-destructive mt-1">
                  {form.formState.errors.startTime.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                {t("endTime")}
              </label>
              <Input type="time" {...form.register("endTime")} className="w-full" required />
              {form.formState.errors.endTime && (
                <p className="text-[11px] text-destructive mt-1">
                  {form.formState.errors.endTime.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              {t("subject")}
            </label>
            <NativeSelect
              {...form.register("subjectId")}
              onChange={onSubjectChange}
              className="w-full"
            >
              {classSubjects.length === 0 ? (
                <NativeSelectOption value="">{t("noSubjectsAssigned")}</NativeSelectOption>
              ) : (
                classSubjects.map((cs) => (
                  <NativeSelectOption key={cs.subjectId} value={cs.subjectId}>
                    {cs.subjectName}
                  </NativeSelectOption>
                ))
              )}
            </NativeSelect>
            {form.formState.errors.subjectId && (
              <p className="text-[11px] text-destructive mt-1">
                {form.formState.errors.subjectId.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              {t("teacher")}
            </label>
            <NativeSelect {...form.register("teacherId")} className="w-full">
              {availableTeachers.length === 0 ? (
                <NativeSelectOption value="">{t("noTeacherAssigned")}</NativeSelectOption>
              ) : (
                availableTeachers.map((tea) => (
                  <NativeSelectOption key={tea.teacherId} value={tea.teacherId}>
                    {tea.teacherName}
                  </NativeSelectOption>
                ))
              )}
            </NativeSelect>
            {form.formState.errors.teacherId && (
              <p className="text-[11px] text-destructive mt-1">
                {form.formState.errors.teacherId.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              {t("roomOptional")}
            </label>
            <Input
              type="text"
              placeholder={t("roomPlaceholder")}
              {...form.register("room")}
              className="w-full"
            />
            {form.formState.errors.room && (
              <p className="text-[11px] text-destructive mt-1">
                {form.formState.errors.room.message}
              </p>
            )}
          </div>

          {form.formState.errors.root && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
              {form.formState.errors.root.message}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending || availableTeachers.length === 0}>
              {isPending ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
