"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Pencil, Plus } from "lucide-react"
import type { z } from "zod"
import { gradeRuleSchema, editGradeRuleSchema } from "@/lib/validations/grading"
import { createGradeRule, updateGradeRule } from "@/actions/results/grade-rules"
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

// Form values are typed by the schema's *input* shape (before z.coerce
// runs), matching exam-schedule-dialog.tsx's pattern - otherwise the
// coerced numeric fields (percentages, grade point) mismatch the
// resolver's expected output type.
type GradeRuleFormInput = z.input<typeof gradeRuleSchema>
type EditGradeRuleFormInput = z.input<typeof editGradeRuleSchema>

type GradeRuleDialogProps = {
  gradingScaleId: string
  gradeRule?: {
    id: string
    minPercentage: number
    maxPercentage: number
    grade: string
    gradeBn: string | null
    gradePoint: number
  }
}

export function GradeRuleDialog({ gradingScaleId, gradeRule }: GradeRuleDialogProps) {
  const t = useTranslations("results")
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isEdit = Boolean(gradeRule)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<GradeRuleFormInput | EditGradeRuleFormInput>({
    resolver: zodResolver(isEdit ? editGradeRuleSchema : gradeRuleSchema),
    defaultValues: isEdit
      ? {
          id: gradeRule!.id,
          gradingScaleId,
          minPercentage: gradeRule!.minPercentage,
          maxPercentage: gradeRule!.maxPercentage,
          grade: gradeRule!.grade,
          gradeBn: gradeRule!.gradeBn ?? "",
          gradePoint: gradeRule!.gradePoint,
        }
      : {
          gradingScaleId,
          minPercentage: 0,
          maxPercentage: 100,
          grade: "",
          gradeBn: "",
          gradePoint: 0,
        },
  })

  function onSubmit(values: GradeRuleFormInput | EditGradeRuleFormInput) {
    startTransition(async () => {
      const result = isEdit ? await updateGradeRule(values) : await createGradeRule(values)
      if (result.error) {
        setError("root", { message: result.error })
        return
      }
      toast.add({
        title: t(isEdit ? "success.gradeRuleUpdated" : "success.gradeRuleCreated"),
        type: "success",
      })
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
            {t("grading.addRule")}
          </>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(isEdit ? "grading.editRuleTitle" : "grading.createRuleTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {errors.root && (
            <Alert variant="destructive">
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )}
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="grade-rule-min">{t("fields.minPercentage")}</FieldLabel>
              <Input
                id="grade-rule-min"
                type="number"
                min={0}
                max={100}
                step="0.01"
                {...register("minPercentage")}
              />
              <FieldError
                errors={[errors.minPercentage && { message: t(errors.minPercentage.message as never) }]}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="grade-rule-max">{t("fields.maxPercentage")}</FieldLabel>
              <Input
                id="grade-rule-max"
                type="number"
                min={0}
                max={100}
                step="0.01"
                {...register("maxPercentage")}
              />
              <FieldError
                errors={[errors.maxPercentage && { message: t(errors.maxPercentage.message as never) }]}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="grade-rule-grade">{t("fields.grade")}</FieldLabel>
              <Input id="grade-rule-grade" {...register("grade")} />
              <FieldError errors={[errors.grade && { message: t(errors.grade.message as never) }]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="grade-rule-grade-bn">{t("fields.gradeBn")}</FieldLabel>
              <Input id="grade-rule-grade-bn" {...register("gradeBn")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="grade-rule-point">{t("fields.gradePoint")}</FieldLabel>
              <Input id="grade-rule-point" type="number" min={0} step="0.01" {...register("gradePoint")} />
              <FieldError
                errors={[errors.gradePoint && { message: t(errors.gradePoint.message as never) }]}
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
