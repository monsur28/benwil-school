"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Pencil, Plus } from "lucide-react"
import {
  createGradingScaleSchema,
  editGradingScaleSchema,
  type CreateGradingScaleInput,
  type EditGradingScaleInput,
} from "@/lib/validations/grading"
import { createGradingScale, updateGradingScale } from "@/actions/results/grading-scales"
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

type GradingScaleDialogProps = {
  gradingScale?: { id: string; name: string; nameBn: string | null; isActive: boolean }
}

export function GradingScaleDialog({ gradingScale }: GradingScaleDialogProps) {
  const t = useTranslations("results")
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isEdit = Boolean(gradingScale)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateGradingScaleInput | EditGradingScaleInput>({
    resolver: zodResolver(isEdit ? editGradingScaleSchema : createGradingScaleSchema),
    defaultValues: isEdit
      ? {
          id: gradingScale!.id,
          name: gradingScale!.name,
          nameBn: gradingScale!.nameBn ?? "",
          isActive: gradingScale!.isActive,
        }
      : { name: "", nameBn: "" },
  })

  function onSubmit(values: CreateGradingScaleInput | EditGradingScaleInput) {
    startTransition(async () => {
      const result = isEdit ? await updateGradingScale(values) : await createGradingScale(values)
      if (!result.success) {
        setError("root", { message: result.error })
        return
      }
      toast.add({
        title: t(isEdit ? "success.gradingScaleUpdated" : "success.gradingScaleCreated"),
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
            {t("grading.createButton")}
          </>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(isEdit ? "grading.editTitle" : "grading.createTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {errors.root && (
            <Alert variant="destructive">
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )}
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="grading-scale-name">{t("fields.name")}</FieldLabel>
              <Input id="grading-scale-name" {...register("name")} />
              <FieldError errors={[errors.name && { message: t(errors.name.message as never) }]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="grading-scale-name-bn">{t("fields.nameBn")}</FieldLabel>
              <Input id="grading-scale-name-bn" {...register("nameBn")} />
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
