"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Pencil, Plus } from "lucide-react"
import {
  createExamSchema,
  editExamSchema,
  type CreateExamInput,
  type EditExamInput,
} from "@/lib/validations/exams"
import { createExam, updateExam } from "@/actions/exams/exams"
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

type ExamDialogProps = {
  academicYears: { id: string; name: string }[]
  examTypes: { id: string; name: string }[]
  exam?: {
    id: string
    name: string
    nameBn: string | null
    academicYearId: string
    examTypeId: string
    startDate: Date
    endDate: Date
    isActive: boolean
  }
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function ExamDialog({ academicYears, examTypes, exam }: ExamDialogProps) {
  const t = useTranslations("exams")
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isEdit = Boolean(exam)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateExamInput | EditExamInput>({
    resolver: zodResolver(isEdit ? editExamSchema : createExamSchema),
    defaultValues: isEdit
      ? {
          id: exam!.id,
          name: exam!.name,
          nameBn: exam!.nameBn ?? "",
          academicYearId: exam!.academicYearId,
          examTypeId: exam!.examTypeId,
          startDate: toDateInputValue(exam!.startDate),
          endDate: toDateInputValue(exam!.endDate),
          isActive: exam!.isActive,
        }
      : {
          name: "",
          nameBn: "",
          academicYearId: academicYears[0]?.id ?? "",
          examTypeId: examTypes[0]?.id ?? "",
          startDate: "",
          endDate: "",
        },
  })

  function onSubmit(values: CreateExamInput | EditExamInput) {
    startTransition(async () => {
      const result = isEdit ? await updateExam(values) : await createExam(values)
      if (!result.success) {
        setError("root", { message: result.error })
        return
      }
      toast.add({ title: t(isEdit ? "success.examUpdated" : "success.examCreated"), type: "success" })
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
            {t("list.createButton")}
          </>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(isEdit ? "dialog.editTitle" : "dialog.createTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {errors.root && (
            <Alert variant="destructive">
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )}
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="exam-name">{t("fields.name")}</FieldLabel>
              <Input id="exam-name" {...register("name")} />
              <FieldError errors={[errors.name && { message: t(errors.name.message as never) }]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="exam-name-bn">{t("fields.nameBn")}</FieldLabel>
              <Input id="exam-name-bn" {...register("nameBn")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="exam-academic-year">{t("fields.academicYear")}</FieldLabel>
              <NativeSelect id="exam-academic-year" {...register("academicYearId")}>
                {academicYears.map((year) => (
                  <NativeSelectOption key={year.id} value={year.id}>
                    {year.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError
                errors={[errors.academicYearId && { message: t(errors.academicYearId.message as never) }]}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="exam-type">{t("fields.examType")}</FieldLabel>
              <NativeSelect id="exam-type" {...register("examTypeId")}>
                {examTypes.map((examType) => (
                  <NativeSelectOption key={examType.id} value={examType.id}>
                    {examType.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError
                errors={[errors.examTypeId && { message: t(errors.examTypeId.message as never) }]}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="exam-start-date">{t("fields.startDate")}</FieldLabel>
              <Input id="exam-start-date" type="date" {...register("startDate")} />
              <FieldError
                errors={[errors.startDate && { message: t(errors.startDate.message as never) }]}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="exam-end-date">{t("fields.endDate")}</FieldLabel>
              <Input id="exam-end-date" type="date" {...register("endDate")} />
              <FieldError
                errors={[errors.endDate && { message: t(errors.endDate.message as never) }]}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {t("actions.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
