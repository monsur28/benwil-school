"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Pencil, Plus } from "lucide-react"
import type { z } from "zod"
import { examScheduleSchema, editExamScheduleSchema } from "@/lib/validations/exams"

// react-hook-form types form values by the schema's *input* shape (before
// z.coerce runs), not its inferred output shape — otherwise fullMarks/
// passMarks (coerced from string form inputs to number) mismatch the
// resolver's expected type.
type ExamScheduleFormInput = z.input<typeof examScheduleSchema>
type EditExamScheduleFormInput = z.input<typeof editExamScheduleSchema>
import { createExamSchedule, updateExamSchedule } from "@/actions/exams/exam-schedules"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/toast"

type ExamScheduleDialogProps = {
  examId: string
  classes: { id: string; name: string }[]
  classSubjects: { classId: string; subjectId: string; subjectName: string }[]
  schedule?: {
    id: string
    classId: string
    subjectId: string
    examDate: Date
    startTime: string | null
    endTime: string | null
    room: string | null
    fullMarks: number
    passMarks: number
  }
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function ExamScheduleDialog({ examId, classes, classSubjects, schedule }: ExamScheduleDialogProps) {
  const t = useTranslations("exams")
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isEdit = Boolean(schedule)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors },
  } = useForm<ExamScheduleFormInput | EditExamScheduleFormInput>({
    resolver: zodResolver(isEdit ? editExamScheduleSchema : examScheduleSchema),
    defaultValues: isEdit
      ? {
          id: schedule!.id,
          examId,
          classId: schedule!.classId,
          subjectId: schedule!.subjectId,
          examDate: toDateInputValue(schedule!.examDate),
          startTime: schedule!.startTime ?? "",
          endTime: schedule!.endTime ?? "",
          room: schedule!.room ?? "",
          fullMarks: schedule!.fullMarks,
          passMarks: schedule!.passMarks,
        }
      : {
          examId,
          classId: classes[0]?.id ?? "",
          subjectId: "",
          examDate: "",
          startTime: "",
          endTime: "",
          room: "",
          fullMarks: 100,
          passMarks: 33,
        },
  })

  const selectedClassId = watch("classId")
  const availableSubjects = classSubjects.filter((cs) => cs.classId === selectedClassId)
  const classField = register("classId")

  function onSubmit(values: ExamScheduleFormInput | EditExamScheduleFormInput) {
    startTransition(async () => {
      const result = isEdit ? await updateExamSchedule(values) : await createExamSchedule(values)
      if (!result.success) {
        setError("root", { message: result.error })
        return
      }
      toast.add({ title: t(isEdit ? "success.scheduleUpdated" : "success.scheduleCreated"), type: "success" })
      setOpen(false)
      reset()
      router.refresh()
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger
        render={isEdit ? <Button variant="ghost" size="icon-sm" /> : <Button size="sm" />}
      >
        {isEdit ? <Pencil /> : (
          <>
            <Plus />
            {t("detail.addSchedule")}
          </>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(isEdit ? "schedule.editTitle" : "schedule.createTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {errors.root && (
            <Alert variant="destructive">
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )}
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="schedule-class">{t("fields.class")}</FieldLabel>
              <NativeSelect
                id="schedule-class"
                {...classField}
                onChange={(event) => {
                  classField.onChange(event)
                  setValue("subjectId", "")
                }}
              >
                {classes.map((cls) => (
                  <NativeSelectOption key={cls.id} value={cls.id}>
                    {cls.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError errors={[errors.classId && { message: t(errors.classId.message as never) }]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="schedule-subject">{t("fields.subject")}</FieldLabel>
              {selectedClassId && availableSubjects.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("schedule.noSubjectsForClass")}</p>
              ) : (
                <NativeSelect id="schedule-subject" disabled={!selectedClassId} {...register("subjectId")}>
                  <NativeSelectOption value="" disabled>
                    —
                  </NativeSelectOption>
                  {availableSubjects.map((cs) => (
                    <NativeSelectOption key={cs.subjectId} value={cs.subjectId}>
                      {cs.subjectName}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              )}
              <FieldError errors={[errors.subjectId && { message: t(errors.subjectId.message as never) }]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="schedule-date">{t("fields.examDate")}</FieldLabel>
              <Input id="schedule-date" type="date" {...register("examDate")} />
              <FieldError errors={[errors.examDate && { message: t(errors.examDate.message as never) }]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="schedule-start-time">{t("fields.startTime")}</FieldLabel>
              <Input id="schedule-start-time" type="time" {...register("startTime")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="schedule-end-time">{t("fields.endTime")}</FieldLabel>
              <Input id="schedule-end-time" type="time" {...register("endTime")} />
              <FieldError errors={[errors.endTime && { message: t(errors.endTime.message as never) }]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="schedule-room">{t("fields.room")}</FieldLabel>
              <Input id="schedule-room" {...register("room")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="schedule-full-marks">{t("fields.fullMarks")}</FieldLabel>
              <Input id="schedule-full-marks" type="number" min={1} {...register("fullMarks", { valueAsNumber: true })} />
              <FieldError errors={[errors.fullMarks && { message: t(errors.fullMarks.message as never) }]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="schedule-pass-marks">{t("fields.passMarks")}</FieldLabel>
              <Input id="schedule-pass-marks" type="number" min={0} {...register("passMarks", { valueAsNumber: true })} />
              <FieldError errors={[errors.passMarks && { message: t(errors.passMarks.message as never) }]} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              type="submit"
              disabled={isPending || (Boolean(selectedClassId) && availableSubjects.length === 0)}
            >
              {t("actions.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
