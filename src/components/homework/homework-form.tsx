"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { createHomeworkSchema, editHomeworkSchema, type CreateHomeworkInput, type EditHomeworkInput } from "@/lib/validations/homework"
import { createHomework, updateHomework, publishHomework } from "@/actions/homework/homework"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/toast"

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10)
}

type TeacherAssignmentOption = {
  classId: string
  className: string
  sectionId: string
  sectionName: string
  subjectId: string
  subjectName: string
}

type ExistingHomework = {
  id: string
  title: string
  instructions: string
  categoryId: string | null
  academicYearId: string
  classId: string
  sectionId: string
  subjectId: string
  assignedDate: Date
  dueDate: Date
}

type HomeworkFormProps = {
  homework?: ExistingHomework
  categories: { id: string; name: string }[]
  academicYearId: string
  academicYearName: string
} & (
  | { mode: "teacher"; assignments: TeacherAssignmentOption[] }
  | {
      mode: "admin"
      classes: { id: string; name: string }[]
      sections: { id: string; classId: string; name: string }[]
      subjects: { id: string; name: string }[]
      teachers: { id: string; name: string }[]
    }
)

export function HomeworkForm(props: HomeworkFormProps) {
  const { homework, categories, academicYearId, academicYearName } = props
  const t = useTranslations("homework")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isEdit = Boolean(homework)

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<CreateHomeworkInput | EditHomeworkInput>({
    resolver: zodResolver(isEdit ? editHomeworkSchema : createHomeworkSchema),
    defaultValues: isEdit
      ? {
          id: homework!.id,
          title: homework!.title,
          instructions: homework!.instructions,
          categoryId: homework!.categoryId ?? "",
          academicYearId: homework!.academicYearId,
          classId: homework!.classId,
          sectionId: homework!.sectionId,
          subjectId: homework!.subjectId,
          teacherId: "",
          assignedDate: toDateInputValue(homework!.assignedDate),
          dueDate: toDateInputValue(homework!.dueDate),
        }
      : {
          title: "",
          instructions: "",
          categoryId: "",
          academicYearId,
          classId: "",
          sectionId: "",
          subjectId: "",
          teacherId: "",
          assignedDate: toDateInputValue(new Date()),
          dueDate: toDateInputValue(new Date()),
        },
  })

  const selectedClassId = watch("classId")
  const selectedSectionId = watch("sectionId")

  // Teacher mode: class/section/subject options are derived entirely from
  // this teacher's own TeacherAssignment rows (never a free choice), and
  // cascade class -> section -> subject. When editing, the page that
  // renders this form is responsible for including the homework's own
  // current class/section/subject in `assignments` even if the underlying
  // TeacherAssignment has since changed, so the form never strands the
  // user on an unselectable value - the server re-validates the final
  // combination regardless (see src/actions/homework/homework.ts).
  const classOptions =
    props.mode === "teacher"
      ? dedupeById(props.assignments.map((a) => ({ id: a.classId, name: a.className })))
      : props.classes

  const sectionOptions =
    props.mode === "teacher"
      ? dedupeById(
          props.assignments
            .filter((a) => a.classId === selectedClassId)
            .map((a) => ({ id: a.sectionId, name: a.sectionName }))
        )
      : props.sections.filter((s) => s.classId === selectedClassId)

  const subjectOptions =
    props.mode === "teacher"
      ? dedupeById(
          props.assignments
            .filter((a) => a.classId === selectedClassId && a.sectionId === selectedSectionId)
            .map((a) => ({ id: a.subjectId, name: a.subjectName }))
        )
      : props.subjects

  function submit(values: CreateHomeworkInput | EditHomeworkInput, publish: boolean) {
    startTransition(async () => {
      if (isEdit) {
        const result = await updateHomework(values)
        if (!result.success) {
          setError("root", { message: result.error })
          return
        }
        toast.add({ title: t("success.homeworkUpdated"), type: "success" })
        router.push(`/homework/${homework!.id}`)
        return
      }

      const result = await createHomework(values)
      if (!result.success) {
        setError("root", { message: result.error })
        return
      }
      const newId = result.data.id

      if (publish) {
        const publishResult = await publishHomework(newId)
        if (!publishResult.success) {
          toast.add({ title: publishResult.error, type: "error" })
          router.push(`/homework/${newId}`)
          return
        }
        toast.add({ title: t("success.published"), type: "success" })
      } else {
        toast.add({ title: t("success.draftSaved"), type: "success" })
      }
      router.push(`/homework/${newId}`)
    })
  }

  return (
    <form onSubmit={handleSubmit((values) => submit(values, false))} noValidate className="space-y-6">
      {errors.root && (
        <Alert variant="destructive">
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      <input type="hidden" {...register("academicYearId")} />

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="homework-title">{t("fields.title")}</FieldLabel>
          <Input id="homework-title" {...register("title")} />
          <FieldError errors={[errors.title && { message: t(errors.title.message as never) }]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="homework-category">{t("fields.category")}</FieldLabel>
          <NativeSelect id="homework-category" {...register("categoryId")}>
            <NativeSelectOption value="">—</NativeSelectOption>
            {categories.map((category) => (
              <NativeSelectOption key={category.id} value={category.id}>
                {category.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>

        <Field>
          <FieldLabel htmlFor="homework-instructions">{t("fields.instructions")}</FieldLabel>
          <Textarea id="homework-instructions" rows={5} {...register("instructions")} />
          <FieldError errors={[errors.instructions && { message: t(errors.instructions.message as never) }]} />
        </Field>

        {props.mode === "admin" && (
          <Field>
            <FieldLabel htmlFor="homework-teacher">{t("fields.teacher")}</FieldLabel>
            <NativeSelect id="homework-teacher" {...register("teacherId")}>
              <NativeSelectOption value="">—</NativeSelectOption>
              {props.teachers.map((teacher) => (
                <NativeSelectOption key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldError errors={[errors.teacherId && { message: t(errors.teacherId.message as never) }]} />
          </Field>
        )}

        <p className="text-xs text-muted-foreground">{academicYearName}</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="homework-class">{t("fields.class")}</FieldLabel>
            <NativeSelect id="homework-class" {...register("classId")}>
              <NativeSelectOption value="">—</NativeSelectOption>
              {classOptions.map((klass) => (
                <NativeSelectOption key={klass.id} value={klass.id}>
                  {klass.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldError errors={[errors.classId && { message: t(errors.classId.message as never) }]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="homework-section">{t("fields.section")}</FieldLabel>
            <NativeSelect id="homework-section" {...register("sectionId")}>
              <NativeSelectOption value="">—</NativeSelectOption>
              {sectionOptions.map((section) => (
                <NativeSelectOption key={section.id} value={section.id}>
                  {section.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldError errors={[errors.sectionId && { message: t(errors.sectionId.message as never) }]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="homework-subject">{t("fields.subject")}</FieldLabel>
            <NativeSelect id="homework-subject" {...register("subjectId")}>
              <NativeSelectOption value="">—</NativeSelectOption>
              {subjectOptions.map((subject) => (
                <NativeSelectOption key={subject.id} value={subject.id}>
                  {subject.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldError errors={[errors.subjectId && { message: t(errors.subjectId.message as never) }]} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="homework-assigned-date">{t("fields.assignedDate")}</FieldLabel>
            <Input id="homework-assigned-date" type="date" {...register("assignedDate")} />
            <FieldError errors={[errors.assignedDate && { message: t(errors.assignedDate.message as never) }]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="homework-due-date">{t("fields.dueDate")}</FieldLabel>
            <Input id="homework-due-date" type="date" {...register("dueDate")} />
            <FieldError errors={[errors.dueDate && { message: t(errors.dueDate.message as never) }]} />
          </Field>
        </div>
      </FieldGroup>

      <div className="flex flex-wrap gap-2">
        {isEdit ? (
          <Button type="submit" disabled={isPending}>
            {t("actions.save")}
          </Button>
        ) : (
          <>
            <Button type="submit" variant="outline" disabled={isPending}>
              {t("actions.saveDraft")}
            </Button>
            <Button type="button" disabled={isPending} onClick={handleSubmit((values) => submit(values, true))}>
              {t("actions.publish")}
            </Button>
          </>
        )}
      </div>
    </form>
  )
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Map<string, T>()
  for (const item of items) {
    if (!seen.has(item.id)) seen.set(item.id, item)
  }
  return [...seen.values()]
}
