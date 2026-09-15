"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Pencil, Plus } from "lucide-react"
import {
  createExamTypeSchema,
  editExamTypeSchema,
  type CreateExamTypeInput,
  type EditExamTypeInput,
} from "@/lib/validations/exams"
import { createExamType, updateExamType } from "@/actions/exams/exam-types"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/toast"

type ExamTypeDialogProps = {
  examType?: { id: string; name: string; nameBn: string | null; isActive: boolean }
}

export function ExamTypeDialog({ examType }: ExamTypeDialogProps) {
  const t = useTranslations("exams")
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isEdit = Boolean(examType)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateExamTypeInput | EditExamTypeInput>({
    resolver: zodResolver(isEdit ? editExamTypeSchema : createExamTypeSchema),
    defaultValues: isEdit
      ? {
          id: examType!.id,
          name: examType!.name,
          nameBn: examType!.nameBn ?? "",
          isActive: examType!.isActive,
        }
      : { name: "", nameBn: "" },
  })

  function onSubmit(values: CreateExamTypeInput | EditExamTypeInput) {
    startTransition(async () => {
      const result = isEdit ? await updateExamType(values) : await createExamType(values)
      if (!result.success) {
        setError("root", { message: result.error })
        return
      }
      toast.add({ title: t(isEdit ? "success.examTypeUpdated" : "success.examTypeCreated"), type: "success" })
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
        render={
          isEdit ? <Button variant="ghost" size="icon-sm" /> : <Button size="sm" />
        }
      >
        {isEdit ? <Pencil /> : (
          <>
            <Plus />
            {t("types.createButton")}
          </>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(isEdit ? "types.editTitle" : "types.createTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {errors.root && (
            <Alert variant="destructive">
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )}
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="exam-type-name">{t("fields.name")}</FieldLabel>
              <Input id="exam-type-name" {...register("name")} />
              <FieldError errors={[errors.name && { message: t(errors.name.message as never) }]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="exam-type-name-bn">{t("fields.nameBn")}</FieldLabel>
              <Input id="exam-type-name-bn" {...register("nameBn")} />
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
