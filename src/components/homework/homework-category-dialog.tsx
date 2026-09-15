"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Pencil, Plus } from "lucide-react"
import {
  createHomeworkCategorySchema,
  editHomeworkCategorySchema,
  type CreateHomeworkCategoryInput,
  type EditHomeworkCategoryInput,
} from "@/lib/validations/homework"
import { createHomeworkCategory, updateHomeworkCategory } from "@/actions/homework/homework-categories"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/toast"

type HomeworkCategoryDialogProps = {
  category?: { id: string; name: string; description: string | null; isActive: boolean }
}

export function HomeworkCategoryDialog({ category }: HomeworkCategoryDialogProps) {
  const t = useTranslations("homework")
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
  } = useForm<CreateHomeworkCategoryInput | EditHomeworkCategoryInput>({
    resolver: zodResolver(isEdit ? editHomeworkCategorySchema : createHomeworkCategorySchema),
    defaultValues: isEdit
      ? { id: category!.id, name: category!.name, description: category!.description ?? "", isActive: category!.isActive }
      : { name: "", description: "" },
  })

  function onSubmit(values: CreateHomeworkCategoryInput | EditHomeworkCategoryInput) {
    startTransition(async () => {
      const result = isEdit ? await updateHomeworkCategory(values) : await createHomeworkCategory(values)
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
      <DialogTrigger
        render={isEdit ? <Button variant="ghost" size="icon-sm" aria-label={t("actions.edit")} /> : <Button size="sm" />}
      >
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
              <FieldLabel htmlFor="homework-category-name">{t("fields.name")}</FieldLabel>
              <Input id="homework-category-name" {...register("name")} />
              <FieldError errors={[errors.name && { message: t(errors.name.message as never) }]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="homework-category-description">{t("fields.description")}</FieldLabel>
              <Textarea id="homework-category-description" rows={2} {...register("description")} />
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
