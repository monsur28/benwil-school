"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Plus } from "lucide-react"
import { createTeacherAssignment } from "@/actions/academics/teacher-assignments"
import { teacherAssignmentSchema } from "@/lib/validations/academics"
import { Button } from "@/components/ui/button"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/toast"

type Teacher = { id: string; name: string }
type ClassOption = { id: string; name: string }
type SectionOption = { id: string; classId: string; name: string }
type ClassSubjectOption = { classId: string; subjectId: string; subjectName: string }

export function TeacherAssignmentDialog({
  teachers,
  classes,
  sections,
  classSubjects,
}: {
  teachers: Teacher[]
  classes: ClassOption[]
  sections: SectionOption[]
  classSubjects: ClassSubjectOption[]
}) {
  const t = useTranslations("academics")
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(teacherAssignmentSchema),
    defaultValues: {
      teacherId: teachers[0]?.id ?? "",
      classId: classes[0]?.id ?? "",
      sectionId: "",
      subjectId: "",
    },
  })

  const selectedClassId = watch("classId")
  const availableSections = sections.filter((section) => section.classId === selectedClassId)
  const availableSubjects = classSubjects.filter((cs) => cs.classId === selectedClassId)
  const classField = register("classId")

  function onSubmit(values: {
    teacherId: string
    classId: string
    sectionId: string
    subjectId: string
  }) {
    startTransition(async () => {
      const result = await createTeacherAssignment(values)
      if (!result.success) {
        setError("root", { message: result.error })
        return
      }
      toast.add({ title: t("success.saved"), type: "success" })
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
      <DialogTrigger render={<Button />}>
        <Plus />
        {t("assignments.addTitle")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("assignments.addTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {errors.root && (
            <Alert variant="destructive">
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )}
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="assignment-teacher">{t("fields.teacher")}</FieldLabel>
              <NativeSelect id="assignment-teacher" {...register("teacherId")}>
                {teachers.map((teacher) => (
                  <NativeSelectOption key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError
                errors={[errors.teacherId && { message: t(errors.teacherId.message as never) }]}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="assignment-class">{t("fields.class")}</FieldLabel>
              <NativeSelect
                id="assignment-class"
                {...classField}
                onChange={(event) => {
                  classField.onChange(event)
                  setValue("sectionId", "")
                  setValue("subjectId", "")
                }}
              >
                {classes.map((klass) => (
                  <NativeSelectOption key={klass.id} value={klass.id}>
                    {klass.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>

            <Field>
              <FieldLabel htmlFor="assignment-section">{t("fields.section")}</FieldLabel>
              <NativeSelect id="assignment-section" {...register("sectionId")}>
                <NativeSelectOption value="" disabled>
                  {t("classDetail.selectSection")}
                </NativeSelectOption>
                {availableSections.map((section) => (
                  <NativeSelectOption key={section.id} value={section.id}>
                    {section.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError
                errors={[errors.sectionId && { message: t(errors.sectionId.message as never) }]}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="assignment-subject">{t("fields.subject")}</FieldLabel>
              <NativeSelect id="assignment-subject" {...register("subjectId")}>
                <NativeSelectOption value="" disabled>
                  {t("classDetail.selectSubject")}
                </NativeSelectOption>
                {availableSubjects.map((cs) => (
                  <NativeSelectOption key={cs.subjectId} value={cs.subjectId}>
                    {cs.subjectName}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError
                errors={[errors.subjectId && { message: t(errors.subjectId.message as never) }]}
              />
              {availableSubjects.length === 0 && (
                <p className="text-xs text-muted-foreground">{t("assignments.noSubjectsForClass")}</p>
              )}
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? t("actions.saving") : t("actions.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
