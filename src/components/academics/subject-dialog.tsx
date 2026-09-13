"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Plus, Pencil } from "lucide-react"
import { createSubject, updateSubject } from "@/actions/academics/subjects"
import { createSubjectSchema } from "@/lib/validations/academics"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

type SubjectRecord = { id: string; name: string; nameBn: string | null; code: string; isActive: boolean }

export function SubjectDialog({
  subject,
}: {
  subject?: SubjectRecord
}) {
  const t = useTranslations("academics")
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isActive, setIsActive] = useState(subject?.isActive ?? true)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: {
      name: subject?.name ?? "",
      nameBn: subject?.nameBn ?? "",
      code: subject?.code ?? "",
    },
  })

  function onSubmit(values: { name: string; nameBn?: string; code: string }) {
    startTransition(async () => {
      const result = subject
        ? await updateSubject({ id: subject.id, ...values, isActive })
        : await createSubject(values)

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
      <DialogTrigger render={<Button variant={subject ? "ghost" : "default"} size={subject ? "sm" : "default"} />}>
        {subject ? <Pencil /> : <Plus />}
        {subject ? t("actions.edit") : t("subjects.addTitle")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{subject ? t("subjects.editTitle") : t("subjects.addTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {errors.root && (
            <Alert variant="destructive">
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )}
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="subject-name">{t("fields.name")}</FieldLabel>
              <Input id="subject-name" aria-invalid={Boolean(errors.name)} {...register("name")} />
              <FieldError errors={[errors.name && { message: t(errors.name.message as never) }]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="subject-nameBn">{t("fields.nameBn")}</FieldLabel>
              <Input id="subject-nameBn" {...register("nameBn")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="subject-code">{t("fields.code")}</FieldLabel>
              <Input id="subject-code" aria-invalid={Boolean(errors.code)} {...register("code")} />
              <FieldError errors={[errors.code && { message: t(errors.code.message as never) }]} />
            </Field>
            {subject && (
              <Field>
                <FieldLabel htmlFor="subject-status">{t("fields.status")}</FieldLabel>
                <NativeSelect
                  id="subject-status"
                  value={isActive ? "active" : "inactive"}
                  onChange={(event) => setIsActive(event.target.value === "active")}
                >
                  <NativeSelectOption value="active">{t("status.active")}</NativeSelectOption>
                  <NativeSelectOption value="inactive">{t("status.inactive")}</NativeSelectOption>
                </NativeSelect>
              </Field>
            )}
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
