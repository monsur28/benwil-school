"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Plus, Pencil } from "lucide-react"
import { createSection, updateSection } from "@/actions/academics/sections"
import { createSectionSchema } from "@/lib/validations/academics"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
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

type SectionRecord = { id: string; name: string; isActive: boolean }

export function SectionDialog({
  classId,
  section,
}: {
  classId: string
  section?: SectionRecord
}) {
  const t = useTranslations("academics")
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isActive, setIsActive] = useState(section?.isActive ?? true)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createSectionSchema),
    defaultValues: { classId, name: section?.name ?? "" },
  })

  function onSubmit(values: { classId: string; name: string }) {
    startTransition(async () => {
      const result = section
        ? await updateSection(classId, { id: section.id, name: values.name, isActive })
        : await createSection(values)

      if (result.error) {
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
      {section ? (
        <DialogTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label={t("actions.edit")} />}
        >
          <Pencil />
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button variant="outline" size="sm" />}>
          <Plus />
          {t("sections.addTitle")}
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{section ? t("sections.editTitle") : t("sections.addTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {errors.root && (
            <Alert variant="destructive">
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )}
          <Field>
            <FieldLabel htmlFor="section-name">{t("fields.name")}</FieldLabel>
            <Input id="section-name" aria-invalid={Boolean(errors.name)} {...register("name")} />
            <FieldError errors={[errors.name && { message: t(errors.name.message as never) }]} />
          </Field>
          {section && (
            <Field>
              <FieldLabel htmlFor="section-status">{t("fields.status")}</FieldLabel>
              <NativeSelect
                id="section-status"
                value={isActive ? "active" : "inactive"}
                onChange={(event) => setIsActive(event.target.value === "active")}
              >
                <NativeSelectOption value="active">{t("status.active")}</NativeSelectOption>
                <NativeSelectOption value="inactive">{t("status.inactive")}</NativeSelectOption>
              </NativeSelect>
            </Field>
          )}
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
