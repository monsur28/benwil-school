"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Pencil, Plus } from "lucide-react"
import {
  createFeeCategorySchema,
  editFeeCategorySchema,
  type CreateFeeCategoryInput,
  type EditFeeCategoryInput,
} from "@/lib/validations/fees"
import { createFeeCategory, updateFeeCategory } from "@/actions/fees/fee-categories"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/toast"

type FeeCategoryDialogProps = {
  category?: { id: string; name: string; nameBn: string | null; description: string | null; isActive: boolean }
}

export function FeeCategoryDialog({ category }: FeeCategoryDialogProps) {
  const t = useTranslations("fees")
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isEdit = Boolean(category)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateFeeCategoryInput | EditFeeCategoryInput>({
    resolver: zodResolver(isEdit ? editFeeCategorySchema : createFeeCategorySchema),
    defaultValues: isEdit
      ? {
          id: category!.id,
          name: category!.name,
          nameBn: category!.nameBn ?? "",
          description: category!.description ?? "",
          isActive: category!.isActive,
        }
      : { name: "", nameBn: "", description: "" },
  })

  function onSubmit(values: CreateFeeCategoryInput | EditFeeCategoryInput) {
    startTransition(async () => {
      const result = isEdit ? await updateFeeCategory(values) : await createFeeCategory(values)
      if (!result.success) {
        setError("root", { message: result.error })
        return
      }
      toast.add({ title: t(isEdit ? "success.categoryUpdated" : "success.categoryCreated"), type: "success" })
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
      <DialogTrigger render={isEdit ? <Button variant="ghost" size="icon-sm" /> : <Button size="sm" />}>
        {isEdit ? (
          <Pencil />
        ) : (
          <>
            <Plus />
            {t("actions.addCategory")}
          </>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(isEdit ? "actions.edit" : "actions.addCategory")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {errors.root && (
            <Alert variant="destructive">
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )}
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="fee-category-name">{t("fields.name")}</FieldLabel>
              <Input id="fee-category-name" {...register("name")} />
              <FieldError errors={[errors.name && { message: t(errors.name.message as never) }]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="fee-category-name-bn">{t("fields.nameBn")}</FieldLabel>
              <Input id="fee-category-name-bn" {...register("nameBn")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="fee-category-description">{t("fields.description")}</FieldLabel>
              <Textarea id="fee-category-description" {...register("description")} />
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
